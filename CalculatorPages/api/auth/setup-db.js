import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  const sql = neon(process.env.DATABASE_URL);

  try {
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Note: In a real app, we'd use bcrypt to hash. 
    // Since we're in a serverless environment and want to avoid heavy native deps,
    // we'll use a simple SHA-256 for this demo, or suggest the user hashes it.
    // For now, I'll check if the admin exists.
    const correctHash = 'ef82d4b7bf68b7ff0df7a313221c7bfacf1e500fc80035ddbaf6b4169a81823f'; 
    await sql`
      INSERT INTO admin_users (email, password_hash) 
      VALUES ('admin@knotstranded.com', ${correctHash})
      ON CONFLICT (email) DO UPDATE SET password_hash = ${correctHash};
    `;

    return res.status(200).json({ success: true, message: 'Database initialized' });
  } catch (error) {
    console.error('DB Setup Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
