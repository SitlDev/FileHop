import { neon } from '@neondatabase/serverless';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, name, log, referrer } = request.body;

  if (!email || !log || !Array.isArray(log)) {
    return response.status(400).json({ error: 'Missing email or log' });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    
    // Migrations for new metrics
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS calculation_count INTEGER DEFAULT 0;`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS referrer TEXT;`;

    // 1. Check if user already exists
    const existingLead = await sql`SELECT id FROM leads WHERE email = ${email} LIMIT 1`;
    const isNewLead = existingLead.length === 0;

    // 2. Upsert into leads table
    const firstEntry = log[0] || {};
    const conversionPage = firstEntry.url || '';
    const newCalcs = log.length;
    
    await sql`
      INSERT INTO leads (name, email, conversion_page, last_activity_at, calculation_count, referrer)
      VALUES (${name || null}, ${email}, ${conversionPage}, CURRENT_TIMESTAMP, ${newCalcs}, ${referrer || 'Direct'})
      ON CONFLICT (email) 
      DO UPDATE SET 
        last_activity_at = CURRENT_TIMESTAMP,
        calculation_count = leads.calculation_count + ${newCalcs},
        name = COALESCE(leads.name, EXCLUDED.name),
        referrer = COALESCE(leads.referrer, EXCLUDED.referrer);
    `;

    // 3. Send Results Email via Resend
    if (process.env.RESEND_API_KEY) {
      try {
        const resultsHtml = log.map(entry => `
          <div style="background: #1a1d24; padding: 32px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.08); margin-bottom: 32px;">
            <div style="display: flex; align-items: center; margin-bottom: 24px;">
              <h2 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: -0.02em;">${entry.tool.toUpperCase()}</h2>
            </div>
            
            <div style="margin-bottom: 28px;">
              <p style="color: #f5a623; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px; opacity: 0.8;">Input Parameters</p>
              <table style="width: 100%; border-collapse: collapse;">
                ${Object.entries(entry.inputs).map(([k, v]) => `
                  <tr>
                    <td style="padding: 8px 0; color: rgba(255,255,255,0.5); font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.03);">${k}</td>
                    <td style="padding: 8px 0; color: #ffffff; font-weight: 600; text-align: right; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.03);">${v}</td>
                  </tr>
                `).join('')}
              </table>
            </div>

            <div style="background: rgba(245, 166, 35, 0.05); padding: 24px; border-radius: 12px; border: 1px solid rgba(245, 166, 35, 0.1);">
              <p style="color: #f5a623; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px;">Calculated Results</p>
              <table style="width: 100%; border-collapse: collapse;">
                ${Object.entries(entry.results).map(([k, v]) => `
                  <tr>
                    <td style="padding: 6px 0; color: rgba(255,255,255,0.7); font-size: 14px;">${k}</td>
                    <td style="padding: 6px 0; color: #f5a623; font-weight: 800; text-align: right; font-size: 18px;">${v}</td>
                  </tr>
                `).join('')}
              </table>
            </div>
          </div>
        `).join('');

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'YourCalc <results@yourcalc.info>',
            to: email,
            subject: `📊 Your Results: ${firstEntry.tool}`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>YourCalc Results</title>
              </head>
              <body style="margin: 0; padding: 0; background-color: #0d0f14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0d0f14;">
                  <tr>
                    <td align="center" style="padding: 60px 20px;">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px;">
                        <!-- Header -->
                        <tr>
                          <td style="padding-bottom: 40px; text-align: center;">
                            <div style="display: inline-block; padding: 12px 20px; border: 2px dashed rgba(245, 166, 35, 0.3); border-radius: 12px;">
                              <span style="color: #f5a623; font-size: 18px; font-weight: 900; letter-spacing: 0.2em;">YOURCALC</span>
                            </div>
                          </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                          <td>
                            <h1 style="color: #ffffff; font-size: 28px; font-weight: 800; margin: 0 0 12px 0; letter-spacing: -0.03em;">Calculation Report</h1>
                            <p style="color: rgba(255,255,255,0.5); font-size: 16px; margin: 0 0 40px 0; line-height: 1.6;">Here is the detailed breakdown of the math you performed on YourCalc.</p>
                            
                            ${resultsHtml}
                            
                            <!-- CTA -->
                            <div style="text-align: center; margin-top: 48px;">
                              <a href="https://yourcalc.info" style="display: inline-block; background-color: #f5a623; color: #000000; padding: 16px 32px; border-radius: 14px; text-decoration: none; font-weight: 800; font-size: 15px; letter-spacing: 0.02em;">RETURN TO DASHBOARD</a>
                            </div>
                          </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                          <td style="padding-top: 60px; border-top: 1px solid rgba(255,255,255,0.05); text-align: center;">
                            <p style="color: rgba(255,255,255,0.3); font-size: 12px; line-height: 1.8; margin: 0;">
                              &copy; 2026 YourCalc &mdash; Professional Mathematical Suite.<br>
                              A KnotStranded LLC Product. Camarillo, CA.<br>
                              <a href="https://yourcalc.info/privacy" style="color: rgba(255,255,255,0.5); text-decoration: none;">Privacy Policy</a> &nbsp;•&nbsp; <a href="https://yourcalc.info/terms" style="color: rgba(255,255,255,0.5); text-decoration: none;">Terms of Use</a>
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
              </html>
            `
          })
        });
      } catch (emailError) {
        console.error('Email Sending Error:', emailError);
      }
    }

    // 4. Batch Insert all log entries
    for (const entry of log) {
      await sql`
        INSERT INTO user_activity (email, tool, inputs, results, url)
        VALUES (${email}, ${entry.tool}, ${JSON.stringify(entry.inputs)}, ${JSON.stringify(entry.results)}, ${entry.url});
      `;
    }

    return response.status(200).json({ success: true, count: log.length, emailed: isNewLead });
  } catch (error) {
    console.error('Database Error:', error);
    return response.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
