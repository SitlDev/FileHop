import { neon } from '@neondatabase/serverless';

export default async function handler(request, response) {
  const urlParams = new URL(request.url, `http://${request.headers.host}`);
  const page_url = urlParams.searchParams.get('url');

  if (!page_url) {
    return response.status(400).json({ error: 'URL required' });
  }

  try {
    const sql = neon("postgresql://neondb_owner:npg_8AsELYGt9Swf@ep-holy-rice-ambxmk5s-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require");
    
    // Fetch only approved comments for this specific page
    const comments = await sql`
      SELECT name, comment, created_at 
      FROM feedback 
      WHERE (page_url = ${page_url} OR page_url LIKE ${'%' + page_url.split('/').pop() + '%'})
      AND status = 'approved'
      ORDER BY created_at DESC 
      LIMIT 50;
    `;

    return response.status(200).json({ comments });
  } catch (error) {
    console.error('Fetch Error:', error);
    return response.status(500).json({ error: error.message });
  }
}
