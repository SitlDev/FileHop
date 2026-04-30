-- YourCalc Database Schema
-- Use this in the Vercel Postgres / Neon Query Console

-- 1. Leads Table (Unique email capture)
CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    name TEXT,
    handle TEXT,
    email TEXT UNIQUE NOT NULL,
    calculation_count INTEGER DEFAULT 1,
    referrer TEXT,
    first_calculation_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    conversion_page TEXT
);

-- 2. User Activity Table (Detailed interaction logs)
CREATE TABLE IF NOT EXISTS user_activity (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    tool TEXT NOT NULL,
    inputs JSONB,
    results JSONB,
    url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Feedback / Comments Table
CREATE TABLE IF NOT EXISTS feedback (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    handle TEXT,
    comment TEXT NOT NULL,
    page_url TEXT,
    parent_id INTEGER REFERENCES feedback(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending', -- pending, approved, flagged
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_activity_email ON user_activity(email);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_feedback_page ON feedback(page_url);
