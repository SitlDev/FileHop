
import clientPromise from './_lib/mongodb';

export default async function handler(req, res) {
    try {
        const { action } = req.query;
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB);

        if (req.method === 'GET') {
            switch (action) {
                case 'vault':
                    const { genre: vGenre, era: vEra, search: vSearch } = req.query;
                    let vQuery = {};
                    if (vGenre) vQuery.genre = vGenre;
                    if (vEra) vQuery.era = vEra;
                    if (vSearch) vQuery.$or = [{ title: { $regex: vSearch, $options: 'i' } }, { author: { $regex: vSearch, $options: 'i' } }];
                    
                    const vaultItems = await db.collection('vault_items').find(vQuery).sort({ dispatched_at: -1 }).toArray();
                    return res.status(200).json({ items: vaultItems });

                case 'pairing':
                    const { id: pId } = req.query;
                    if (!pId) return res.status(400).json({ error: 'Pairing ID required' });
                    
                    const pairing = await db.collection('pairings').findOne({ pairing_id: pId });
                    if (!pairing) return res.status(404).json({ error: 'Pairing ritual not found' });
                    
                    return res.status(200).json(pairing);

                case 'comment':
                    const { itemId, memberEmail, content } = req.body;
                    if (!itemId || !content) return res.status(400).json({ error: 'Incomplete comment data' });
                    
                    await db.collection('vault_comments').insertOne({
                        item_id: itemId,
                        email: memberEmail,
                        content,
                        created_at: new Date()
                    });
                    return res.status(200).json({ success: true });

                default:
                    return res.status(400).json({ error: 'Invalid action' });
            }
        }

        if (req.method === 'POST') {
            switch (action) {
                case 'unsubscribe':
                    const { email } = req.body;
                    await db.collection('newsletter').updateOne({ email }, { $set: { status: 'unsubscribed', unsubscribed_at: new Date() } });
                    return res.status(200).json({ success: true });

                case 'join':
                    const { email: joinEmail } = req.body;
                    await db.collection('newsletter').updateOne({ email: joinEmail }, { $set: { status: 'subscribed', updated_at: new Date() }, $setOnInsert: { created_at: new Date() } }, { upsert: true });
                    return res.status(200).json({ success: true });

                default:
                    return res.status(400).json({ error: 'Invalid action' });
            }
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error("Public API Error:", error);
        return res.status(500).json({ error: error.message || "Archive access failed." });
    }
}
