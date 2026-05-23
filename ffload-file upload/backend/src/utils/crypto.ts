import jwt from 'jsonwebtoken';

export function generateToken(userId: string, isAdmin: boolean = false): string {
  return jwt.sign(
    { userId, isAdmin },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): { userId: string; isAdmin?: boolean } {
  return jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
    userId: string;
    isAdmin?: boolean;
  };
}

export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(password, 10);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(password, hash);
}
