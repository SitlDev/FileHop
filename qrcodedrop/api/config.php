<?php
/**
 * API Configuration & PostgreSQL Database Connection (Neon)
 * All API endpoints use this file for database operations
 */

// PostgreSQL (Neon) Configuration
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_PORT', getenv('DB_PORT') ?: '5432');
define('DB_USER', getenv('DB_USER') ?: 'postgres');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_NAME', getenv('DB_NAME') ?: 'tools_platform');

// Neon specific connection string
define('DATABASE_URL', getenv('DATABASE_URL') ?: null);

// Company Information
define('COMPANY_NAME', 'KnotStranded LLC');
define('COMPANY_LOCATION', 'Camarillo, CA, USA');
define('COMPANY_EMAIL', 'admin@knotstranded.com');
define('COMPANY_PHONE', '');
define('COMPANY_WEBSITE', 'https://knotstranded.com');

// Email Configuration
define('NEWSLETTER_EMAIL', getenv('NEWSLETTER_EMAIL') ?: 'newsletter@knotstranded.com');
define('SUPPORT_EMAIL', getenv('SUPPORT_EMAIL') ?: 'admin@knotstranded.com');

// Google Ads Configuration
define('GOOGLE_ADSENSE_CLIENT', getenv('GOOGLE_ADSENSE_CLIENT') ?: 'ca-pub-XXXXXXXXXXXXXXXX');

// Session Configuration
define('SESSION_DURATION', 3600); // 1 hour

/**
 * PostgreSQL Database Connection Class
 * Uses PDO for better prepared statement support
 */
class Database {
    private $connection;
    
    public function __construct() {
        try {
            // If DATABASE_URL is provided (Neon), parse it
            if (DATABASE_URL) {
                $dbUrl = parse_url(DATABASE_URL);
                $dsn = sprintf(
                    'pgsql:host=%s;port=%s;dbname=%s',
                    $dbUrl['host'],
                    $dbUrl['port'] ?? 5432,
                    ltrim($dbUrl['path'], '/')
                );
                
                $this->connection = new PDO(
                    $dsn,
                    $dbUrl['user'],
                    $dbUrl['pass'],
                    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
                );
            } else {
                // Standard connection
                $dsn = sprintf(
                    'pgsql:host=%s;port=%s;dbname=%s',
                    DB_HOST,
                    DB_PORT,
                    DB_NAME
                );
                
                $this->connection = new PDO(
                    $dsn,
                    DB_USER,
                    DB_PASS,
                    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
                );
            }
            
            // Set UTF-8 charset
            $this->connection->exec("SET NAMES 'utf8'");
            
        } catch (PDOException $e) {
            error_log('Database connection failed: ' . $e->getMessage());
            http_response_code(500);
            exit(json_encode(['error' => 'Database connection failed']));
        }
    }
    
    /**
     * Execute a prepared statement query
     * @param string $sql SQL query with ? placeholders
     * @param array $params Parameters to bind
     * @return PDOStatement
     */
    public function query($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            
            if (!empty($params)) {
                // Bind parameters with correct types
                foreach ($params as $key => $value) {
                    $pdoType = PDO::PARAM_STR;
                    
                    if (is_int($value)) {
                        $pdoType = PDO::PARAM_INT;
                    } elseif (is_bool($value)) {
                        $pdoType = PDO::PARAM_BOOL;
                    } elseif (is_null($value)) {
                        $pdoType = PDO::PARAM_NULL;
                    }
                    
                    $stmt->bindValue($key + 1, $value, $pdoType);
                }
            }
            
            $stmt->execute();
            return $stmt;
            
        } catch (PDOException $e) {
            error_log('Query error: ' . $e->getMessage() . ' | SQL: ' . $sql);
            throw new Exception('Database query failed: ' . $e->getMessage());
        }
    }
    
    /**
     * Get a single row
     * @param string $sql SQL query
     * @param array $params Parameters
     * @return array|false
     */
    public function getRow($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get all rows
     * @param string $sql SQL query
     * @param array $params Parameters
     * @return array
     */
    public function getRows($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get count of affected rows
     * @return int
     */
    public function getAffectedRows() {
        return $this->statement->rowCount() ?? 0;
    }
    
    /**
     * Get last inserted ID
     * @param string $sequence Sequence name (for PostgreSQL)
     * @return string
     */
    public function getLastInsertId($sequence = 'id') {
        return $this->connection->lastInsertId($sequence);
    }
    
    /**
     * Begin transaction
     */
    public function beginTransaction() {
        $this->connection->beginTransaction();
    }
    
    /**
     * Commit transaction
     */
    public function commit() {
        $this->connection->commit();
    }
    
    /**
     * Rollback transaction
     */
    public function rollback() {
        $this->connection->rollback();
    }
    
    /**
     * Close database connection
     */
    public function close() {
        $this->connection = null;
    }
}

/**
 * Utility Functions
 */
function sanitizeEmail($email) {
    return filter_var($email, FILTER_SANITIZE_EMAIL);
}

function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

function getUserIP() {
    if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
        return $_SERVER['HTTP_CF_CONNECTING_IP'];
    } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        return explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0];
    }
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

function getClientLocation($ip) {
    $location = ['country' => null, 'region' => null];
    
    // Use MaxMind GeoIP2 or similar service
    // Placeholder for geo-location lookup
    
    return $location;
}

function generateSessionID() {
    return bin2hex(random_bytes(32));
}

function logError($tool, $errorType, $message, $trace = '') {
    try {
        $db = new Database();
        $ip = getUserIP();
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        
        $sql = "INSERT INTO error_logs (tool_name, error_type, error_message, stack_trace, user_ip) 
                VALUES (?, ?, ?, ?, ?)";
        
        $db->query($sql, [$tool, $errorType, $message, $trace, $ip]);
        $db->close();
    } catch (Exception $e) {
        error_log('Failed to log error: ' . $e->getMessage());
    }
}

function sendResponse($data, $statusCode = 200) {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit();
}

// CORS Headers for API
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Security Headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
header('Content-Security-Policy: default-src \'self\'; script-src \'self\' \'unsafe-inline\' https://pagead2.googlesyndication.com');
