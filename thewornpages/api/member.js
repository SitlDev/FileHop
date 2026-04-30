
import clientPromise from './_lib/mongodb';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export default async function handler(req, res) {
    try {
        const { action } = req.query;
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB);

        // GET Actions
        if (req.method === 'GET') {
            const { email } = req.query;
            if (!email) return res.status(400).json({ error: 'Email required' });

            const member = await db.collection('members').findOne({ email });
            if (!member) return res.status(404).json({ error: 'Member not found' });
            return res.status(200).json(member);
        }

        // POST Actions
        if (req.method === 'POST') {
            const { email } = req.body;

            switch (action) {
                case 'auth':
                    const { token, provider } = req.body;
                    if (provider === 'google') {
                        const ticket = await googleClient.verifyIdToken({
                            idToken: token,
                            audience: process.env.GOOGLE_CLIENT_ID,
                        });
                        const payload = ticket.getPayload();
                        return res.status(200).json({ success: true, user: payload });
                    }
                    return res.status(400).json({ error: 'Unsupported provider' });

                case 'pause':
                    const { months } = req.body;
                    const resumeDate = new Date();
                    resumeDate.setMonth(resumeDate.getMonth() + parseInt(months));
                    await db.collection('members').updateOne(
                        { email },
                        { $set: { status: 'paused', paused_at: new Date(), resume_at: resumeDate } }
                    );
                    return res.status(200).json({ success: true, message: `Sanctuary paused until ${resumeDate.toLocaleDateString()}` });

                case 'resume':
                    await db.collection('members').updateOne(
                        { email },
                        { $set: { status: 'active' }, $unset: { paused_at: "", resume_at: "" } }
                    );
                    return res.status(200).json({ success: true, message: 'Welcome back to the sanctuary.' });

                case 'rare-hunt':
                    const { title, author } = req.body;
                    const member = await db.collection('members').findOne({ email });
                    if (!member || !member.plan_name?.toLowerCase().includes('devotee')) {
                        return res.status(403).json({ error: 'Exclusive to Devotees' });
                    }
                    await db.collection('rare_hunts').insertOne({ email, title, author, status: 'hunting', created_at: new Date() });
                    return res.status(200).json({ success: true });

                case 'update':
                    const { shipping, interests } = req.body;
                    await db.collection('members').updateOne(
                        { email },
                        { $set: { shipping, interests, updated_at: new Date() } }
                    );
                    return res.status(200).json({ success: true });

                case 'recommend':
                    const { title: rTitle, author: rAuthor, why } = req.body;
                    await db.collection('recommendations').insertOne({
                        email,
                        title: rTitle,
                        author: rAuthor,
                        reason: why,
                        status: 'pending',
                        created_at: new Date()
                    });
                    return res.status(200).json({ success: true });

                default:
                    return res.status(400).json({ error: 'Invalid action' });
            }
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error("Member API Error:", error);
        return res.status(500).json({ error: error.message || "Failed to process member request." });
    }
}
