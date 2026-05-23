import { Response } from 'express';
import { validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { AuthError, ValidationError } from '../utils/errors';
import { generateToken, hashPassword, comparePassword } from '../utils/crypto';
import { EmailService } from '../services/EmailService';

const prisma = new PrismaClient();

export class AuthController {
  static async register(req: AuthRequest, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const { email, password, name } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AuthError('Email already registered');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: passwordHash,
        name,
      },
    });

    // Send welcome email (optional - don't fail if Resend not configured)
    try {
      await EmailService.sendWelcomeEmail(email, name);
    } catch (emailError) {
      console.warn('Failed to send welcome email:', emailError);
      // Continue anyway - don't fail the registration
    }

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        storageUsedBytes: Number(user.storageUsedBytes),
        storageQuotaBytes: Number(user.storageQuotaBytes),
      },
    });
  }

  static async login(req: AuthRequest, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      throw new AuthError('Invalid credentials');
    }

    // Check password
    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      throw new AuthError('Invalid credentials');
    }

    // Generate token
    const token = generateToken(user.id, email === process.env.ADMIN_EMAIL);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        storageUsedBytes: Number(user.storageUsedBytes),
        storageQuotaBytes: Number(user.storageQuotaBytes),
        subscriptionStatus: user.subscriptionStatus,
      },
    });
  }

  static async logout(req: AuthRequest, res: Response) {
    // Token-based auth, just return success
    // Frontend should remove token from storage
    res.json({ message: 'Logged out successfully' });
  }

  static async googleCallback(req: AuthRequest, res: Response) {
    const { googleId, email, name, image } = req.body;

    if (!googleId || !email) {
      throw new ValidationError('Missing Google auth data');
    }

    // Find or create user
    let user = await prisma.user.findUnique({ where: { googleId } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          googleId,
          name,
          image,
          password: null, // OAuth users don't need password
        },
      });

      // Send welcome email
      await EmailService.sendWelcomeEmail(email, name || 'User');
    }

    // Generate token
    const token = generateToken(user.id, email === process.env.ADMIN_EMAIL);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        storageUsedBytes: user.storageUsedBytes,
        storageQuotaBytes: user.storageQuotaBytes,
      },
    });
  }
}
