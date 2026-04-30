
import clientPromise from './_lib/mongodb';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
    try {
        if (req.headers.authorization !== `Bearer ${process.env.ADMIN_SECRET}`) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { action } = req.query;
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB);

        if (req.method === 'GET') {
            switch (action) {
                case 'members':
                    const members = await db.collection('members').find({}).sort({ created_at: -1 }).toArray();
                    return res.status(200).json(members);
                case 'subscribers':
                    const subscribers = await db.collection('newsletter').find({}).sort({ created_at: -1 }).toArray();
                    return res.status(200).json(subscribers);
                case 'inventory':
                    const inventory = await db.collection('inventory').find({}).toArray();
                    return res.status(200).json(inventory);
                case 'ops_manual':
                    const manuals = await db.collection('ops_manual').find({}).toArray();
                    return res.status(200).json(manuals);
                case 'stats':
                    const memberCount = await db.collection('members').countDocuments({ status: 'active' });
                    const subCount = await db.collection('newsletter').countDocuments({ status: 'subscribed' });
                    const activeMembers = await db.collection('members').find({ status: 'active' }).toArray();
                    const mrr = activeMembers.reduce((acc, m) => acc + (parseInt(m.price) || 0), 0);
                    return res.status(200).json({ members: memberCount, newsletter: subCount, mrr });
                default:
                    return res.status(400).json({ error: 'Invalid GET action' });
            }
        }

        if (req.method === 'POST') {
            switch (action) {
                case 'update_inventory':
                    const { item_id, quantity, status: invStatus } = req.body;
                    await db.collection('inventory').updateOne({ item_id }, { $set: { quantity, status: invStatus, updated_at: new Date() } }, { upsert: true });
                    return res.status(200).json({ success: true });
                
                case 'update_manual':
                    const { title, content, category } = req.body;
                    await db.collection('ops_manual').updateOne({ title }, { $set: { content, category, updated_at: new Date() } }, { upsert: true });
                    return res.status(200).json({ success: true });

                case 'dispatch':
                    const { email } = req.body;
                    // Dispatch logic (simplified for consolidation)
                    await db.collection('members').updateOne({ email }, { $set: { status: 'dispatched', updated_at: new Date() } });
                    return res.status(200).json({ success: true });

                case 'create_pairing':
                    const { title: pTitle, author: pAuthor, atmosphere, tea, music, recipient_email } = req.body;
                    const { generateSanctuaryVoice } = await import('./_lib/audio');
                    
                    const audioBase64 = await generateSanctuaryVoice(pTitle, atmosphere);
                    
                    const pairingId = Math.random().toString(36).substring(2, 10).toUpperCase();
                    await db.collection('pairings').insertOne({
                        pairing_id: pairingId,
                        title: pTitle,
                        author: pAuthor,
                        atmosphere,
                        tea,
                        music,
                        recipient_email,
                        audio: audioBase64,
                        created_at: new Date()
                    });
                    
                    return res.status(200).json({ success: true, pairing_id: pairingId });

                default:
                    return res.status(400).json({ error: 'Invalid POST action' });
            }
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error("Admin API Error:", error);
        return res.status(500).json({ error: error.message || "Admin operation failed." });
    }
}
