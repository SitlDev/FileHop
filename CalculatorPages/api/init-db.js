import { neon } from '@neondatabase/serverless';

export default async function handler(request, response) {
  const { secret } = request.query;
  if (process.env.NODE_ENV === 'production' && secret !== 'setup123') {
    return response.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const sql = neon(`${process.env.DATABASE_URL}`);

    // 1. Leads Table (Unique email collection)
    await sql(`
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        first_calculation_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        conversion_page TEXT
      );
    `);

    // 2. User Activity Table (Detailed logs)
    await sql(`
      CREATE TABLE IF NOT EXISTS user_activity (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        tool TEXT NOT NULL,
        inputs JSONB,
        results JSONB,
        url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Feedback Table (Community comments)
    await sql(`
      CREATE TABLE IF NOT EXISTS feedback (
        id SERIAL PRIMARY KEY,
        name TEXT,
        email TEXT,
        comment TEXT NOT NULL,
        page_url TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Indices
    await sql(`CREATE INDEX IF NOT EXISTS idx_activity_email ON user_activity(email);`);
    await sql(`CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);`);
    await sql(`CREATE INDEX IF NOT EXISTS idx_feedback_page ON feedback(page_url);`);

    return response.status(200).json({ 
      success: true, 
      message: 'Database tables initialized successfully.',
      tables: ['leads', 'user_activity', 'feedback']
    });
  } catch (error) {
    console.error('Initialization Error:', error);
    return response.status(500).json({ error: error.message });
  }
}
