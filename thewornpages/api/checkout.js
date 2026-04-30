
import Stripe from 'stripe';
import clientPromise from './_lib/mongodb';
import { Resend } from 'resend';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
    try {
        const { action } = req.query;
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB);

        if (req.method === 'POST') {
            switch (action) {
                case 'intent':
                    const { amount, email, plan_name } = req.body;
                    let customer;
                    const customers = await stripe.customers.list({ email, limit: 1 });
                    if (customers.data.length > 0) {
                        customer = customers.data[0];
                    } else {
                        customer = await stripe.customers.create({ email });
                    }

                    const intent = await stripe.paymentIntents.create({
                        amount: Math.round(amount * 100),
                        currency: 'usd',
                        customer: customer.id,
                        setup_future_usage: 'off_session',
                        metadata: { plan_name }
                    });
                    return res.status(200).json({ clientSecret: intent.client_secret, customerId: customer.id });

                case 'confirm':
                    const { email: confirmEmail, plan_name: plan, amount: pAmount, stripe_customer_id } = req.body;
                    
                    // Archive the order
                    await db.collection('orders').insertOne({
                        email: confirmEmail,
                        plan_name: plan,
                        amount: pAmount || 0,
                        stripe_customer_id,
                        status: 'paid',
                        created_at: new Date()
                    });

                    await db.collection('members').updateOne(
                        { email: confirmEmail },
                        { $set: { ...req.body, status: 'active', updated_at: new Date() }, $setOnInsert: { created_at: new Date() } },
                        { upsert: true }
                    );
                    // Send confirmation email
                    await resend.emails.send({
                        from: 'The Worn Pages Club <treasury@thewornpages.com>',
                        to: confirmEmail,
                        subject: 'Welcome to the Inner Circle',
                        html: `<h1>Curation Confirmed</h1><p>Your journey into the ${plan} begins. Your sensory ritual is being prepared.</p>`
                    });
                    return res.status(200).json({ success: true });

                case 'portal':
                    const { email: portalEmail } = req.body;
                    const member = await db.collection('members').findOne({ email: portalEmail });
                    let cid = member?.stripe_customer_id;
                    if (!cid) {
                        const scs = await stripe.customers.list({ email: portalEmail, limit: 1 });
                        if (scs.data.length > 0) cid = scs.data[0].id;
                    }
                    if (!cid) return res.status(404).json({ error: 'Customer not found' });

                    const session = await stripe.billingPortal.sessions.create({
                        customer: cid,
                        return_url: `${req.headers.origin}/profile.html`
                    });
                    return res.status(200).json({ url: session.url });

                default:
                    return res.status(400).json({ error: 'Invalid action' });
            }
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error("Checkout API Error:", error);
        return res.status(500).json({ error: error.message || "Checkout failed." });
    }
}
