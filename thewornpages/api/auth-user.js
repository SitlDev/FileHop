
import { OAuth2Client } from 'google-auth-library';
import clientPromise from './_lib/mongodb';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { token, provider } = req.body;
        const mongo = await clientPromise;
        const db = mongo.db(process.env.MONGODB_DB);

        let email, name;

        if (provider === 'google') {
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            email = payload.email;
            name = payload.name;
        } else {
            return res.status(400).json({ error: 'Unsupported provider' });
        }

        // Find or create member record
        let user = await db.collection('members').findOne({ email });
        
        if (!user) {
            // New user from OAuth
            const newUser = {
                email,
                name,
                status: 'lead',
                provider,
                created_at: new Date(),
                updated_at: new Date()
            };
            await db.collection('members').insertOne(newUser);
            user = newUser;
        }

        return res.status(200).json({ success: true, user });

    } catch (error) {
        console.error("Auth Error:", error);
        return res.status(500).json({ error: "Authentication failed." });
    }
}
