import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { NotFoundError } from '../utils/errors';

const prisma = new PrismaClient();

export class ProfileController {
  static async getProfile(req: AuthRequest, res: Response) {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        storageUsedBytes: true,
        storageQuotaBytes: true,
        subscriptionStatus: true,
        subscriptionEndDate: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    res.json({
      user: {
        ...user,
        storageUsedBytes: Number(user.storageUsedBytes),
        storageQuotaBytes: Number(user.storageQuotaBytes),
      }
    });
  }

  static async updateProfile(req: AuthRequest, res: Response) {
    const userId = req.userId!;
    const { name, image } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(image && { image }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
      },
    });

    res.json({ user });
  }

  static async getStorageInfo(req: AuthRequest, res: Response) {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        storageUsedBytes: true,
        storageQuotaBytes: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    const percentUsed = Number(user.storageUsedBytes) / Number(user.storageQuotaBytes);

    // Get file breakdown
    const uploads = await prisma.upload.findMany({
      where: {
        userId,
        status: 'active',
      },
      select: {
        id: true,
        filename: true,
        fileSizeBytes: true,
        uploadedAt: true,
      },
      orderBy: { fileSizeBytes: 'desc' },
    });

    res.json({
      storageUsedBytes: Number(user.storageUsedBytes),
      storageQuotaBytes: Number(user.storageQuotaBytes),
      percentUsed,
      uploads: uploads.map(u => ({
        id: u.id,
        filename: u.filename,
        fileSizeBytes: Number(u.fileSizeBytes),
        uploadedAt: u.uploadedAt,
      })),
    });
  }
}
