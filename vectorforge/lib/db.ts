import { neon } from '@neondatabase/serverless';

// Lazy initialization to prevent errors during build or if env var is missing
const getSql = () => {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  return neon(url);
};

export interface UsageStat {
  tool_name: string;
  action: string;
  count: string | number;
  date: string;
}

export async function trackUsage(toolName: string, action: string, metadata: any = {}) {
  try {
    const sql = getSql();
    if (!sql) return;

    // Create table if not exists (usually run once, but safe for serverless)
    await sql`
      CREATE TABLE IF NOT EXISTS usage_logs (
        id SERIAL PRIMARY KEY,
        tool_name VARCHAR(50),
        action VARCHAR(50),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      INSERT INTO usage_logs (tool_name, action, metadata)
      VALUES (${toolName}, ${action}, ${JSON.stringify(metadata)});
    `;
  } catch (error) {
    console.error('Database tracking error:', error);
  }
}

export async function getUsageStats(): Promise<UsageStat[]> {
  try {
    const sql = getSql();
    if (!sql) return [];

    const rows = await sql`
      SELECT 
        tool_name, 
        action, 
        COUNT(*) as count,
        DATE(created_at) as date
      FROM usage_logs
      GROUP BY tool_name, action, DATE(created_at)
      ORDER BY date DESC, count DESC;
    `;
    return rows as unknown as UsageStat[];
  } catch (error) {
    console.error('Database retrieval error:', error);
    return [];
  }
}
