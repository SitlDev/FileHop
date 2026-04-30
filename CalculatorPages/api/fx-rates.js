/**
 * Vercel Serverless Function: /api/fx-rates
 * Proxies live ECB exchange rate data from api.frankfurter.app.
 * This bypasses CORS restrictions when called from the browser.
 */
export default async function handler(req, res) {
    // Allow any origin to call this endpoint
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400'); // Cache 1hr on edge

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const upstream = await fetch('https://api.frankfurter.app/latest?from=EUR', {
            headers: { 'Accept': 'application/json' }
        });

        if (!upstream.ok) {
            throw new Error(`Upstream ${upstream.status}`);
        }

        const data = await upstream.json();
        // Inject EUR itself (base currency) into the rates map
        data.rates['EUR'] = 1.0;

        return res.status(200).json(data);
    } catch (err) {
        console.error('fx-rates proxy error:', err);
        return res.status(502).json({ error: 'Failed to fetch live rates', detail: err.message });
    }
}
