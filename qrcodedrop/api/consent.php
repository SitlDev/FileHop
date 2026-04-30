<?php
/**
 * GDPR Consent & Privacy Management API
 * Handles unsubscription, data deletion, preferences, email verification
 * PostgreSQL (Neon) compatible
 */

require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(['error' => 'Method not allowed'], 405);
}

$action = $_GET['action'] ?? $_POST['action'] ?? null;

if (!$action) {
    sendResponse(['error' => 'Action parameter required'], 400);
}

try {
    $db = new Database();
    
    switch ($action) {
        case 'unsubscribe':
            handleUnsubscribe($db);
            break;
            
        case 'delete':
            handleDataDeletion($db);
            break;
            
        case 'preference':
            handleConsentPreference($db);
            break;
            
        case 'verify':
            handleEmailVerification($db);
            break;
            
        case 'contact':
            handleContactData($db);
            break;
            
        default:
            sendResponse(['error' => 'Unknown action'], 400);
    }
    
} catch (Exception $e) {
    logError('consent', 'consent_error', $e->getMessage());
    sendResponse(['error' => 'An error occurred processing your request'], 500);
}

function handleUnsubscribe($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    $email = $input['email'] ?? null;
    
    if (!$email) {
        sendResponse(['error' => 'Email required'], 400);
    }
    
    $email = sanitizeEmail($email);
    
    $sql = "UPDATE email_subscriptions 
            SET active = FALSE, unsubscribed_at = CURRENT_TIMESTAMP 
            WHERE email = ?";
    
    $db->query($sql, [$email]);
    
    $db->close();
    sendResponse(['message' => 'Successfully unsubscribed'], 200);
}

function handleDataDeletion($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    $email = $input['email'] ?? null;
    
    if (!$email || !validateEmail($email)) {
        sendResponse(['error' => 'Valid email required'], 400);
    }
    
    $email = sanitizeEmail($email);
    
    try {
        // Begin transaction
        $db->beginTransaction();
        
        // Get user data for deletion log
        $getEmailSql = "SELECT * FROM email_subscriptions WHERE email = ?";
        $userData = $db->getRow($getEmailSql, [$email]);
        
        if ($userData) {
            // Create anonymized email (GDPR: anonymization not deletion)
            $anonymizedEmail = md5($email) . '@deleted.local';
            
            // Anonymize email subscriptions
            $updateEmailSql = "UPDATE email_subscriptions 
                              SET email = ?, active = FALSE 
                              WHERE email = ?";
            $db->query($updateEmailSql, [$anonymizedEmail, $email]);
            
            // Anonymize contacts
            $updateContactSql = "UPDATE user_contacts 
                                SET email = ? 
                                WHERE email = ?";
            $db->query($updateContactSql, [$anonymizedEmail, $email]);
            
            // Delete consent records
            $deleteConsentSql = "DELETE FROM user_consent WHERE email = ?";
            $db->query($deleteConsentSql, [$email]);
            
            // Log deletion
            $deleteLogSql = "INSERT INTO data_deletion_log (email, deletion_reason, data_deleted, requested_at, completed_at) 
                            VALUES (?, 'user_request', ?::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)";
            
            $deletedData = json_encode([
                'email_subscriptions' => 1,
                'user_contacts' => 1
            ]);
            
            $db->query($deleteLogSql, [$email, $deletedData]);
        }
        
        // Commit transaction
        $db->commit();
        
        $db->close();
        sendResponse(['message' => 'Your data has been deleted in accordance with GDPR'], 200);
        
    } catch (Exception $e) {
        $db->rollback();
        throw $e;
    }
}

function handleConsentPreference($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    $email = $input['email'] ?? null;
    $consentType = $input['consent_type'] ?? null;
    $consented = $input['consented'] ?? false;
    
    if (!$email || !$consentType) {
        sendResponse(['error' => 'Email and consent_type required'], 400);
    }
    
    $email = sanitizeEmail($email);
    $ip = getUserIP();
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
    
    // Valid consent types: marketing, features, analytics
    $validTypes = ['marketing', 'features', 'analytics'];
    if (!in_array($consentType, $validTypes)) {
        sendResponse(['error' => 'Invalid consent type'], 400);
    }
    
    $sql = "INSERT INTO user_consent (email, consent_type, consented, ip_address, user_agent, timestamp) 
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT (email, consent_type) DO UPDATE 
            SET consented = EXCLUDED.consented, timestamp = CURRENT_TIMESTAMP";
    
    $db->query($sql, [$email, $consentType, $consented, $ip, $userAgent]);
    
    $db->close();
    sendResponse(['message' => 'Consent preference updated'], 200);
}

function handleEmailVerification($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    $token = $input['token'] ?? null;
    
    if (!$token) {
        sendResponse(['error' => 'Verification token required'], 400);
    }
    
    $sql = "UPDATE email_subscriptions 
            SET verified_at = CURRENT_TIMESTAMP 
            WHERE verification_token = ? AND verified_at IS NULL";
    
    $db->query($sql, [$token]);
    
    $db->close();
    sendResponse(['message' => 'Email verified successfully'], 200);
}

function handleContactData($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    if (!isset($input['email'])) {
        sendResponse(['error' => 'Email is required'], 400);
    }
    
    $email = sanitizeEmail($input['email']);
    if (!validateEmail($email)) {
        sendResponse(['error' => 'Invalid email'], 400);
    }
    
    $firstName = $input['first_name'] ?? null;
    $lastName = $input['last_name'] ?? null;
    $phone = $input['phone'] ?? null;
    $organization = $input['organization'] ?? null;
    $website = $input['website'] ?? null;
    $sourceTool = $input['source_tool'] ?? 'unknown';
    
    $sql = "INSERT INTO user_contacts (first_name, last_name, email, phone, organization, website, source_tool) 
            VALUES (?, ?, ?, ?, ?, ?, ?)";
    
    $db->query($sql, [$firstName, $lastName, $email, $phone, $organization, $website, $sourceTool]);
    
    // Record analytics
    $analyticsSql = "INSERT INTO analytics_events 
                    (event_type, tag, tool_name, user_ip, event_details) 
                    VALUES (?, ?, ?, ?, ?::jsonb)";
    
    $eventDetails = json_encode(['source' => $sourceTool, 'contact_captured' => true]);
    $db->query($analyticsSql, ['contact_captured', $sourceTool, $sourceTool, getUserIP(), $eventDetails]);
    
    $db->close();
    sendResponse(['message' => 'Contact information saved', 'status' => 'success'], 200);
}
