<?php
/**
 * Analytics API Endpoint
 * Tracks tool usage, user behavior, and generates insights
 * PostgreSQL (Neon) compatible
 */

require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Return analytics summary
    handleAnalyticsQuery();
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Log new event
    handleAnalyticsEvent();
} else {
    sendResponse(['error' => 'Method not allowed'], 405);
}

function handleAnalyticsEvent() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['event']) && !isset($input['timestamp'])) {
        sendResponse(['error' => 'Invalid event data'], 400);
    }
    
    $eventType = $input['event'] ?? 'unknown';
    $tag = $input['tag'] ?? 'general';
    $toolName = $input['tag'] ?? 'unknown';
    $url = $input['url'] ?? $_SERVER['HTTP_REFERER'] ?? '';
    $referrer = $input['referrer'] ?? '';
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
    $ip = getUserIP();
    
    // Prepare event details JSON
    $eventDetails = json_encode([
        'input' => $input['details']['input'] ?? null,
        'resultCount' => $input['details']['resultCount'] ?? null,
        'actionType' => $input['details']['actionType'] ?? null,
        'duration' => $input['details']['duration'] ?? null,
        'source' => $input['details']['source'] ?? null
    ]);
    
    try {
        $db = new Database();
        
        // Insert event
        $sql = "INSERT INTO analytics_events 
                (event_type, tag, tool_name, user_ip, user_agent, url, referrer, event_details) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?::jsonb)";
        
        $db->query($sql, [
            $eventType,
            $tag,
            $toolName,
            $ip,
            $userAgent,
            $url,
            $referrer,
            $eventDetails
        ]);
        
        // Update or create user session
        updateUserSession($ip, $userAgent, $toolName);
        
        $db->close();
        
        sendResponse(['status' => 'success', 'message' => 'Event logged'], 200);
        
    } catch (Exception $e) {
        logError('analytics', 'event_logging_error', $e->getMessage());
        sendResponse(['error' => 'Failed to log event'], 500);
    }
}

function handleAnalyticsQuery() {
    $summary = isset($_GET['summary']);
    $tool = $_GET['tool'] ?? null;
    $dateFrom = $_GET['from'] ?? null;
    $dateTo = $_GET['to'] ?? null;
    
    try {
        $db = new Database();
        
        if ($summary) {
            // Return summary statistics
            $totalVisits = $db->getRow("SELECT COUNT(*) as count FROM analytics_events WHERE event_type = 'page_load'");
            $totalEvents = $db->getRow("SELECT COUNT(*) as count FROM analytics_events");
            $subscribers = $db->getRow("SELECT COUNT(*) as count FROM email_subscriptions WHERE active = TRUE");
            
            // Get tool statistics
            $toolStats = [];
            $toolResult = $db->getRows("
                SELECT tag, COUNT(*) as count 
                FROM analytics_events 
                WHERE event_type IN ('page_load', 'feature_use') 
                GROUP BY tag 
                ORDER BY count DESC 
                LIMIT 10
            ");
            
            foreach ($toolResult as $row) {
                $toolStats[$row['tag']] = (int)$row['count'];
            }
            
            $response = [
                'totalVisits' => (int)($totalVisits['count'] ?? 0),
                'totalEvents' => (int)($totalEvents['count'] ?? 0),
                'subscribers' => (int)($subscribers['count'] ?? 0),
                'toolStats' => $toolStats
            ];
            
            sendResponse($response, 200);
        }
        
        // Detailed query
        $conditions = [];
        $params = [];
        
        if ($tool) {
            $conditions[] = "tag = ?";
            $params[] = $tool;
        }
        
        if ($dateFrom) {
            $conditions[] = "DATE(timestamp) >= ?::date";
            $params[] = $dateFrom;
        }
        
        if ($dateTo) {
            $conditions[] = "DATE(timestamp) <= ?::date";
            $params[] = $dateTo;
        }
        
        $where = !empty($conditions) ? "WHERE " . implode(" AND ", $conditions) : "";
        
        $sql = "SELECT 
                    event_type,
                    tag,
                    COUNT(*) as event_count,
                    COUNT(DISTINCT user_ip) as unique_users,
                    DATE(timestamp) as event_date
                FROM analytics_events 
                $where
                GROUP BY event_type, tag, DATE(timestamp)
                ORDER BY event_date DESC
                LIMIT 100";
        
        $events = $db->getRows($sql, $params);
        
        $db->close();
        
        sendResponse(['data' => $events], 200);
        
    } catch (Exception $e) {
        logError('analytics', 'query_error', $e->getMessage());
        sendResponse(['error' => 'Failed to retrieve analytics'], 500);
    }
}

function updateUserSession($ip, $userAgent, $toolName) {
    try {
        $db = new Database();
        
        // Try to update first (for existing sessions)
        $updateSql = "UPDATE user_sessions 
                      SET last_activity = CURRENT_TIMESTAMP 
                      WHERE user_ip = ? AND user_agent = ?";
        
        $db->query($updateSql, [$ip, $userAgent]);
        
        // If no rows updated, insert new session
        if ($db->getAffectedRows() === 0) {
            $insertSql = "INSERT INTO user_sessions (session_id, user_ip, user_agent) 
                          VALUES (?, ?, ?)";
            
            $sessionId = generateSessionID();
            $db->query($insertSql, [$sessionId, $ip, $userAgent]);
        }
        
        $db->close();
    } catch (Exception $e) {
        error_log('Failed to update session: ' . $e->getMessage());
    }
}
