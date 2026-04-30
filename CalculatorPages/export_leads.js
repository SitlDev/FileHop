const { neon } = require('@neondatabase/serverless');
const fs = require('fs');

// Connection string from your .env.development.local
const DATABASE_URL ="postgresql://neondb_owner:npg_8AsELYGt9Swf@ep-holy-rice-ambxmk5s-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function runExport() {
  console.log('Connecting to database...');
  const sql = neon(DATABASE_URL);
  
  try {
    // Ensure tables exist first
    console.log('Ensuring tables are initialized...');
    await sql`
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        first_calculation_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        conversion_page TEXT
      );
    `;

    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS name TEXT;`;
    
    await sql`
      CREATE TABLE IF NOT EXISTS user_activity (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        tool TEXT NOT NULL,
        inputs JSONB,
        results JSONB,
        url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS feedback (
        id SERIAL PRIMARY KEY,
        name TEXT,
        email TEXT,
        comment TEXT NOT NULL,
        page_url TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const leads = await sql`SELECT email, conversion_page, first_calculation_at, last_activity_at FROM leads ORDER BY last_activity_at DESC`;
    
    if (leads.length === 0) {
      console.log('No leads found in database.');
      return;
    }

    const headers = ['Email', 'Page', 'First Seen', 'Last Seen'];
    const csvContent = [
      headers.join(','),
      ...leads.map(l => [
        l.email,
        l.conversion_page || 'Unknown',
        l.first_calculation_at,
        l.last_activity_at
      ].join(','))
    ].join('\n');

    fs.writeFileSync('leads_backup.csv', csvContent);
    console.log(`\n✅ Success! Exported ${leads.length} leads to leads_backup.csv`);
  } catch (err) {
    console.error('Export failed:', err.message);
  }
}

runExport();
