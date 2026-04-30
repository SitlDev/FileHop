import { neon } from '@neondatabase/serverless';
import { webcrypto as crypto } from 'node:crypto';

async function hashPassword(password) {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function signSession(payload, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password } = req.body;
  const sql = neon(process.env.DATABASE_URL);
  const AUTH_SECRET = process.env.AUTH_SECRET || 'your-fallback-secret-change-me';

  try {
    const users = await sql`SELECT * FROM admin_users WHERE email = ${email}`;
    if (users.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = users[0];
    const incomingHash = await hashPassword(password);

    if (incomingHash !== user.password_hash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create session
    const payload = JSON.stringify({ id: user.id, email: user.email, exp: Date.now() + 86400000 });
    const signature = await signSession(payload, AUTH_SECRET);
    const sessionToken = `${btoa(payload)}.${signature}`;

    res.setHeader('Set-Cookie', [
      `yc_session=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`
    ]);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
