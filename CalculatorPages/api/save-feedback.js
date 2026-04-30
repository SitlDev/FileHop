import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, email, handle, comment, url, parent_id } = req.body;

    if (!comment || !email) {
        return res.status(400).json({ error: 'Comment and email are required' });
    }

    // suspect filter
    const suspectKeywords = ['spam', 'buy', 'http', 'www', '.com', 'casino', 'viagra', 'fuck', 'shit', 'piss', 'bitch'];
    let status = 'approved';
    const lowerComment = (comment || '').toLowerCase();
    
    if (suspectKeywords.some(kw => lowerComment.includes(kw))) {
        status = 'pending'; // Flagged for review
    }

    try {
        const sql = neon("postgresql://neondb_owner:npg_8AsELYGt9Swf@ep-holy-rice-ambxmk5s-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require");

        // Self-healing migrations
        await sql`ALTER TABLE feedback ADD COLUMN IF NOT EXISTS parent_id INTEGER;`;
        await sql`ALTER TABLE feedback ADD COLUMN IF NOT EXISTS handle TEXT;`;
        await sql`ALTER TABLE feedback ADD COLUMN IF NOT EXISTS name TEXT;`;

        // 1. Save feedback
        await sql`
            INSERT INTO feedback (name, email, handle, comment, page_url, parent_id, status) 
            VALUES (${name || 'Anonymous'}, ${email}, ${handle || null}, ${comment}, ${url || null}, ${parent_id || null}, ${status})
        `;

        // 2. Sync lead data
        await sql`
            INSERT INTO leads (name, email, handle, conversion_page, last_activity_at)
            VALUES (${name || null}, ${email}, ${handle || null}, ${url || null}, NOW())
            ON CONFLICT (email) DO UPDATE
                SET last_activity_at = NOW(),
                    name = COALESCE(leads.name, EXCLUDED.name),
                    handle = COALESCE(leads.handle, EXCLUDED.handle)
        `;

        return res.status(200).json({ success: true, message: 'Comment posted' });
    } catch (error) {
        console.error('Feedback Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
