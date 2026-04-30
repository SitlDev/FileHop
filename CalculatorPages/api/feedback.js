import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, subject, message, url } = req.body;

  if (!email || !message) {
    return res.status(400).json({ error: 'Email and message are required' });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    
    // Save to feedback table
    await sql`
      INSERT INTO feedback (email, handle, comment, page_url, status)
      VALUES (${email}, ${name || 'Anonymous'}, ${`[${subject}] ${message}`}, ${url || 'contact_page'}, 'pending')
    `;

    return res.status(200).json({ success: true, message: 'Feedback received' });
  } catch (error) {
    console.error('Feedback Error:', error);
    return res.status(500).json({ error: 'Failed to save feedback' });
  }
}
