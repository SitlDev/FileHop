-- Tools Platform Database Schema - PostgreSQL (Neon)
-- Created: April 19, 2026

-- =============================================
-- EMAIL SUBSCRIPTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS email_subscriptions (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    source VARCHAR(100),
    source_tool VARCHAR(100),
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    verification_token VARCHAR(255),
    verified_at TIMESTAMP NULL,
    unsubscribed_at TIMESTAMP NULL
);

CREATE INDEX idx_email ON email_subscriptions(email);
CREATE INDEX idx_verified ON email_subscriptions(verified_at);
CREATE INDEX idx_active ON email_subscriptions(active);

-- =============================================
-- ANALYTICS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS analytics_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    tag VARCHAR(100),
    tool_name VARCHAR(100),
    user_ip VARCHAR(45),
    user_agent TEXT,
    url VARCHAR(2048),
    referrer VARCHAR(2048),
    event_details JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_event_type ON analytics_events(event_type);
CREATE INDEX idx_tag ON analytics_events(tag);
CREATE INDEX idx_tool ON analytics_events(tool_name);
CREATE INDEX idx_timestamp ON analytics_events(timestamp);
CREATE INDEX idx_user_ip ON analytics_events(user_ip);
CREATE INDEX idx_analytics_date ON analytics_events(DATE(timestamp));

-- =============================================
-- USER SESSIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_ip VARCHAR(45),
    user_agent TEXT,
    first_visit TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tool_usage JSONB,
    location_country VARCHAR(2),
    location_region VARCHAR(100)
);

CREATE INDEX idx_session_id ON user_sessions(session_id);
CREATE INDEX idx_session_ip ON user_sessions(user_ip);
CREATE INDEX idx_session_activity ON user_sessions(last_activity);

-- =============================================
-- TOOL USAGE STATISTICS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS tool_usage_stats (
    id SERIAL PRIMARY KEY,
    tool_name VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    total_visits INT DEFAULT 0,
    unique_visitors INT DEFAULT 0,
    total_actions INT DEFAULT 0,
    avg_session_duration FLOAT DEFAULT 0,
    bounce_rate FLOAT DEFAULT 0,
    UNIQUE(tool_name, date)
);

CREATE INDEX idx_stats_tool ON tool_usage_stats(tool_name);
CREATE INDEX idx_stats_date ON tool_usage_stats(date);

-- =============================================
-- USER CONTACT INFORMATION (from VCard/Contact exports)
-- =============================================
CREATE TABLE IF NOT EXISTS user_contacts (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    organization VARCHAR(200),
    website VARCHAR(255),
    notes TEXT,
    source_tool VARCHAR(100),
    captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contact_email ON user_contacts(email);
CREATE INDEX idx_contact_name ON user_contacts(first_name, last_name);

-- =============================================
-- EVENT DETAILS (QR Codes, Contacts, Calendar Events)
-- =============================================
CREATE TABLE IF NOT EXISTS event_records (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50),
    title VARCHAR(255),
    description TEXT,
    email VARCHAR(255),
    phone VARCHAR(20),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    location VARCHAR(255),
    url VARCHAR(2048),
    created_by_tool VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_event_type ON event_records(event_type);
CREATE INDEX idx_event_tool ON event_records(created_by_tool);
CREATE INDEX idx_event_created ON event_records(created_at);

-- =============================================
-- WIFI NETWORK INFORMATION (from WiFi QR codes)
-- =============================================
CREATE TABLE IF NOT EXISTS wifi_networks (
    id SERIAL PRIMARY KEY,
    ssid VARCHAR(32),
    security_type VARCHAR(20),
    encrypted BOOLEAN DEFAULT TRUE,
    qr_generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_wifi_ssid ON wifi_networks(ssid);

-- =============================================
-- GENERATED CONTENT HISTORY
-- =============================================
CREATE TABLE IF NOT EXISTS content_history (
    id SERIAL PRIMARY KEY,
    user_session_id VARCHAR(255),
    tool_name VARCHAR(100),
    input_data JSONB,
    output_data JSONB,
    action_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_history_session ON content_history(user_session_id);
CREATE INDEX idx_history_tool ON content_history(tool_name);
CREATE INDEX idx_history_action ON content_history(action_type);
CREATE INDEX idx_history_created ON content_history(created_at);

-- =============================================
-- NEWSLETTER CAMPAIGNS
-- =============================================
CREATE TABLE IF NOT EXISTS newsletter_campaigns (
    id SERIAL PRIMARY KEY,
    campaign_name VARCHAR(255),
    subject VARCHAR(255),
    html_content TEXT,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_campaign_created ON newsletter_campaigns(created_at);

-- =============================================
-- NEWSLETTER DELIVERY TRACKING
-- =============================================
CREATE TABLE IF NOT EXISTS newsletter_delivery (
    id SERIAL PRIMARY KEY,
    campaign_id INT REFERENCES newsletter_campaigns(id),
    email_id INT REFERENCES email_subscriptions(id),
    status VARCHAR(50),
    opened_at TIMESTAMP NULL,
    clicked_at TIMESTAMP NULL,
    bounced_at TIMESTAMP NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_delivery_campaign ON newsletter_delivery(campaign_id);
CREATE INDEX idx_delivery_email ON newsletter_delivery(email_id);
CREATE INDEX idx_delivery_status ON newsletter_delivery(status);

-- =============================================
-- PRIVACY & CONSENT RECORDS
-- =============================================
CREATE TABLE IF NOT EXISTS user_consent (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255),
    consent_type VARCHAR(100),
    consented BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT
);

CREATE INDEX idx_consent_email ON user_consent(email);
CREATE INDEX idx_consent_type ON user_consent(consent_type);

-- =============================================
-- DATA RETENTION & DELETION LOG
-- =============================================
CREATE TABLE IF NOT EXISTS data_deletion_log (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255),
    deletion_reason VARCHAR(100),
    data_deleted JSONB,
    deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    requested_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL
);

CREATE INDEX idx_deletion_email ON data_deletion_log(email);

-- =============================================
-- API KEYS & INTEGRATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS api_keys (
    id SERIAL PRIMARY KEY,
    key_name VARCHAR(255),
    api_key VARCHAR(255) UNIQUE,
    secret_key VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP NULL,
    active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_api_key ON api_keys(api_key);

-- =============================================
-- ERROR LOGS
-- =============================================
CREATE TABLE IF NOT EXISTS error_logs (
    id SERIAL PRIMARY KEY,
    tool_name VARCHAR(100),
    error_type VARCHAR(100),
    error_message TEXT,
    stack_trace TEXT,
    user_ip VARCHAR(45),
    occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_error_tool ON error_logs(tool_name);
CREATE INDEX idx_error_type ON error_logs(error_type);
CREATE INDEX idx_error_occurred ON error_logs(occurred_at);
