import { neon } from '@neondatabase/serverless';

export default async function handler(request, response) {
  // Robust query retrieval
  const url = new URL(request.url, `http://${request.headers.host}`);
  const secret = (url.searchParams.get('secret') || request.query.secret || '').trim();
  const id = url.searchParams.get('id') || request.query.id;
  const action = url.searchParams.get('action') || request.query.action;

  try {
    if (secret !== 'yourcalc123' && secret !== 'h14sua12') {
        return response.status(401).json({ error: 'Unauthorized' });
    }

    if (!id || !action) {
        return response.status(400).json({ error: 'Missing parameters' });
    }

    const sql = neon("postgresql://neondb_owner:npg_8AsELYGt9Swf@ep-holy-rice-ambxmk5s-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require");
    
    if (action === 'approve') {
      await sql`UPDATE feedback SET status = 'approved' WHERE id = ${id}`;
    } else if (action === 'delete') {
      await sql`DELETE FROM feedback WHERE id = ${id}`;
    } else if (action === 'flag') {
        await sql`UPDATE feedback SET status = 'pending' WHERE id = ${id}`;
    }

    return response.status(200).json({ success: true });
  } catch (error) {
    console.error('Action Error:', error);
    return response.status(500).json({ error: error.message });
  }
}
