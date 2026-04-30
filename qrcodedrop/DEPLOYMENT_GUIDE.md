# Neon PostgreSQL Database Setup & Deployment Guide

## Overview

This project uses Neon PostgreSQL for data storage. Neon is a serverless PostgreSQL platform that integrates seamlessly with modern web applications.

## Prerequisites

- Neon account (free tier available at https://neon.tech)
- PHP 8.0+ with PDO PostgreSQL extension
- psql CLI tool (optional, for running migrations)

## Step 1: Create Neon Project

1. Go to [Neon Console](https://console.neon.tech)
2. Click "Create a New Project"
3. Choose a project name, region, and database name
4. Note your connection string from the "Connection Details" section

The connection string will look like:
```
postgresql://[user]:[password]@[host].neon.tech:5432/[database]?sslmode=require
```

## Step 2: Set Environment Variables

### Local Development
1. Copy `.env.example` to `.env`
2. Add your Neon connection string:
```bash
DATABASE_URL=postgresql://user:password@host.neon.tech:5432/dbname?sslmode=require
```

### Production (Hosting Provider)
Set the `DATABASE_URL` environment variable in your hosting control panel or deployment service.

## Step 3: Create Database Schema

### Option A: Using psql CLI

```bash
psql $DATABASE_URL -f database.sql
```

### Option B: Programmatically

```php
// From project root
require_once 'api/config.php';

$db = new Database();
$schema = file_get_contents(__DIR__ . '/database.sql');

// Execute SQL (split by statements)
$statements = array_filter(array_map('trim', explode(';', $schema)));
foreach ($statements as $statement) {
    if (!empty($statement)) {
        try {
            $db->connection->exec($statement);
        } catch (Exception $e) {
            echo "Error executing statement: " . $e->getMessage() . "\n";
        }
    }
}
```

## Step 4: Verify Installation

Make a test request to the analytics endpoint:

```bash
curl -X GET "https://your-domain.com/api/analytics.php?summary=1"
```

Expected response:
```json
{
  "totalVisits": 0,
  "totalEvents": 0,
  "subscribers": 0,
  "toolStats": {}
}
```

## PostgreSQL vs MySQL - Key Differences

### Data Types
- MySQL: `JSON` → PostgreSQL: `JSONB` (better for querying)
- MySQL: `DATETIME` → PostgreSQL: `TIMESTAMP`
- MySQL: `INT AUTO_INCREMENT PRIMARY KEY` → PostgreSQL: `SERIAL PRIMARY KEY`

### Syntax Changes Implemented

| Feature | MySQL | PostgreSQL |
|---------|-------|-----------|
| JSON casting | `JSON` | `::jsonb` |
| Current timestamp | `CURRENT_TIMESTAMP` | `CURRENT_TIMESTAMP` |
| Date casting | `DATE()` | `DATE()` |
| UPSERT | `ON DUPLICATE KEY UPDATE` | `ON CONFLICT DO UPDATE` |
| Unique constraints | `UNIQUE KEY` | `UNIQUE()` |
| Last insert ID | `mysqli_insert_id()` | `lastInsertId()` |

### API Code Changes
- **Database.php**: Changed from MySQLi to PDO for better prepared statements
- **All endpoints**: Updated SQL syntax for PostgreSQL compatibility
- **Prepared statements**: All queries use parameterized queries for security

## Database Tables Overview

| Table | Purpose |
|-------|---------|
| `email_subscriptions` | Stores newsletter subscribers with verification status |
| `analytics_events` | Logs all user interactions and events |
| `user_sessions` | Tracks unique user sessions |
| `tool_usage_stats` | Daily aggregated usage statistics |
| `user_contacts` | Contact information from tool exports |
| `event_records` | QR codes, calendar events, and generated content |
| `wifi_networks` | WiFi credentials from QR codes |
| `content_history` | Audit trail of user actions |
| `newsletter_campaigns` | Email campaign definitions |
| `newsletter_delivery` | Delivery tracking and open/click rates |
| `user_consent` | GDPR consent records |
| `data_deletion_log` | Right-to-be-forgotten audit trail |
| `api_keys` | Integration keys for external services |
| `error_logs` | Application errors for debugging |

## API Endpoints

### POST /api/newsletter.php
Subscribe to newsletter
```bash
curl -X POST "https://your-domain.com/api/newsletter.php" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "source": "tool_name",
    "source_tool": "anagram-solver"
  }'
```

### GET /api/analytics.php
Get analytics summary
```bash
curl "https://your-domain.com/api/analytics.php?summary=1"
```

### POST /api/analytics.php
Log an event
```bash
curl -X POST "https://your-domain.com/api/analytics.php" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "feature_use",
    "tag": "anagram-solver",
    "details": {"input": "listen", "resultCount": 5}
  }'
```

### POST /api/consent.php
Manage user consent
```bash
# Unsubscribe
curl -X POST "https://your-domain.com/api/consent.php?action=unsubscribe" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'

# Request data deletion
curl -X POST "https://your-domain.com/api/consent.php?action=delete" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'

# Update consent preferences
curl -X POST "https://your-domain.com/api/consent.php?action=preference" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "consent_type": "marketing",
    "consented": false
  }'
```

## Troubleshooting

### Connection Error: "could not connect to server"
- Verify Neon project is active
- Check DATABASE_URL syntax includes `?sslmode=require`
- Ensure your IP is not blocked by Neon firewall

### SSL Certificate Error
- Neon requires SSL connections; ensure `?sslmode=require` is in URL

### Table Not Found Error
- Run database.sql schema migration
- Verify you're connected to correct database

### PDO Driver Error
- Ensure PHP PDO PostgreSQL extension is installed: `php -m | grep pdo_pgsql`
- Install if missing: `apt-get install php-pgsql` (Ubuntu/Debian)

## Performance Optimization

### Indexes
All frequently queried columns have indexes for fast lookups:
```sql
CREATE INDEX idx_email ON email_subscriptions(email);
CREATE INDEX idx_event_type ON analytics_events(event_type);
CREATE INDEX idx_timestamp ON analytics_events(timestamp);
```

### JSONB Advantages
PostgreSQL's JSONB type allows querying inside JSON fields:
```sql
SELECT * FROM analytics_events 
WHERE event_details->>'action_type' = 'copy'
AND timestamp > NOW() - INTERVAL '7 days';
```

## Security Considerations

1. **Prepared Statements**: All queries use parameterized inputs to prevent SQL injection
2. **SSL/TLS**: Neon enforces encrypted connections
3. **CORS Headers**: API restricts cross-origin access
4. **Input Validation**: All emails and inputs are validated before storage
5. **Data Anonymization**: GDPR deletion uses anonymization, not hard deletion

## Scaling

Neon automatically scales storage and compute. For high-traffic scenarios:

1. **Connection Pooling**: Use PgBouncer (included in Neon)
2. **Read Replicas**: Neon Pro supports read-only replicas
3. **Partitioning**: Consider partitioning analytics_events table by date if > 100M rows

## Backup & Recovery

Neon provides:
- Automatic daily backups (retained 7 days)
- Point-in-time recovery (PITR)
- Manual backup snapshots in Pro tier

To manually backup:
```bash
pg_dump $DATABASE_URL > backup.sql
```

To restore:
```bash
psql $DATABASE_URL < backup.sql
```

## Further Reading

- [Neon Documentation](https://neon.tech/docs/introduction)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PDO PostgreSQL Manual](https://www.php.net/manual/en/ref.pdo-pgsql.php)
