<?php
/**
 * Email Subscription API Endpoint
 * Handles newsletter signups with full GDPR compliance
 * PostgreSQL (Neon) compatible
 */

require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(['error' => 'Method not allowed'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);

// Validate input
if (!isset($input['email'])) {
    sendResponse(['error' => 'Email is required'], 400);
}

$email = sanitizeEmail($input['email']);
if (!validateEmail($email)) {
    sendResponse(['error' => 'Invalid email address'], 400);
}

$source = $input['source'] ?? 'unknown';
$sourceTool = $input['source_tool'] ?? $input['tag'] ?? 'general';
$ip = getUserIP();

try {
    $db = new Database();
    
    // Check if email already exists
    $checkSql = "SELECT id, active FROM email_subscriptions WHERE email = ?";
    $result = $db->query($checkSql, [$email]);
    $existingUser = $result->fetch(PDO::FETCH_ASSOC);
    
    if ($existingUser) {
        if ($existingUser['active']) {
            sendResponse(['message' => 'Already subscribed', 'status' => 'success'], 200);
        } else {
            // Reactivate subscription
            $updateSql = "UPDATE email_subscriptions SET active = TRUE, unsubscribed_at = NULL WHERE email = ?";
            $db->query($updateSql, [$email]);
        }
    } else {
        // Generate verification token
        $verificationToken = bin2hex(random_bytes(32));
        
        // Insert new subscription
        $insertSql = "INSERT INTO email_subscriptions 
                     (email, source, source_tool, verification_token) 
                     VALUES (?, ?, ?, ?)";
        
        $db->query($insertSql, [$email, $source, $sourceTool, $verificationToken]);
    }
    
    // Log consent
    $consentSql = "INSERT INTO user_consent 
                   (email, consent_type, consented, ip_address, user_agent) 
                   VALUES (?, 'newsletter', TRUE, ?, ?)";
    
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
    $db->query($consentSql, [$email, $ip, $userAgent]);
    
    // Record analytics
    $analyticsSql = "INSERT INTO analytics_events 
                    (event_type, tag, tool_name, user_ip, user_agent, event_details) 
                    VALUES (?, ?, ?, ?, ?, ?)";
    
    $eventDetails = json_encode(['subscription_source' => $source, 'tool' => $sourceTool]);
    $db->query($analyticsSql, ['email_subscribed', $sourceTool, $sourceTool, $ip, $userAgent, $eventDetails]);
    
    $db->close();
    
    sendResponse([
        'message' => 'Successfully subscribed to newsletter',
        'status' => 'success',
        'email' => $email
    ], 200);
    
} catch (Exception $e) {
    logError('newsletter', 'subscription_error', $e->getMessage());
    sendResponse(['error' => 'Subscription failed. Please try again later.'], 500);
}
