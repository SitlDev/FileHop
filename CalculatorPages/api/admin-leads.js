import { neon } from '@neondatabase/serverless';

export default async function handler(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const secret = (url.searchParams.get('secret') || request.query.secret || '').trim();
  
  // Authentication
  if (secret !== 'h14sua12') {
    return response.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const dbUrl = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_8AsELYGt9Swf@ep-holy-rice-ambxmk5s-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require";
    const sql = neon(dbUrl);
    
    // Comprehensive Self-Healing Migrations
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS name TEXT;`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS handle TEXT;`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS calculation_count INTEGER DEFAULT 0;`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS referrer TEXT;`;
    
    await sql`ALTER TABLE feedback ADD COLUMN IF NOT EXISTS handle TEXT;`;
    await sql`ALTER TABLE feedback ADD COLUMN IF NOT EXISTS parent_id INTEGER;`;
    await sql`ALTER TABLE feedback ADD COLUMN IF NOT EXISTS name TEXT;`;

    // 1. Fetch Global KPI Totals (including Live Views)
    const [totals] = await sql`
      SELECT 
        (SELECT COUNT(*) FROM leads) as total_visitors,
        (SELECT COUNT(*) FROM user_activity) as total_pageviews,
        (SELECT COUNT(*) FROM feedback) as total_feedback,
        (SELECT COUNT(DISTINCT email) FROM user_activity WHERE created_at > NOW() - INTERVAL '5 minutes') as active_now
    `;

    // 2. Fetch Leads
    const leads = await sql`
      SELECT id, name, handle, email, calculation_count, referrer, first_calculation_at, last_activity_at, conversion_page 
      FROM leads 
      ORDER BY last_activity_at DESC 
      LIMIT 50;
    `;

    // 3. Fetch Top Tools & Pages
    const topTools = await sql`
      SELECT tool, COUNT(*) as count 
      FROM user_activity 
      GROUP BY tool 
      ORDER BY count DESC 
      LIMIT 10;
    `;

    const topPages = await sql`
      SELECT url, COUNT(*) as count 
      FROM user_activity 
      GROUP BY url 
      ORDER BY count DESC 
      LIMIT 10;
    `;

    // 4. Fetch Traffic Trend (Last 7 Days)
    const trend = await sql`
      SELECT 
        TO_CHAR(created_at, 'Mon DD') as day,
        COUNT(*) as count
      FROM user_activity
      WHERE created_at > NOW() - INTERVAL '7 days'
      GROUP BY day, DATE_TRUNC('day', created_at)
      ORDER BY DATE_TRUNC('day', created_at) ASC;
    `;

    // 5. Fetch Feedback
    const feedback = await sql`
      SELECT id, name, handle, email, comment, page_url, parent_id, created_at, status 
      FROM feedback 
      ORDER BY created_at DESC 
      LIMIT 100;
    `;

    return response.status(200).json({ 
      leads, 
      feedback, 
      stats: {
        totals,
        topTools,
        topPages,
        trend
      }
    });
  } catch (error) {
    console.error('Admin Fetch Error:', error);
    return response.status(500).json({ error: error.message });
  }
}
