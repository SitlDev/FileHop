import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { ForbiddenError, NotFoundError } from '../utils/errors';

const prisma = new PrismaClient();

export class AdminController {
  static async getDashboard(req: AuthRequest, res: Response) {
    if (!req.isAdmin) {
      throw new ForbiddenError('Admin access required');
    }

    // Total stats
    const totalUploads = await prisma.upload.count({ where: { status: 'active' } });
    const totalDownloads = await prisma.downloadLog.count();
    const totalUsers = await prisma.user.count();
    const activeSubscribers = await prisma.user.count({
      where: { subscriptionStatus: 'active' },
    });

    // Revenue
    const payments = await prisma.payment.findMany({
      where: { status: 'succeeded' },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const monthlyRevenue = payments
      .filter(p => {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        return p.createdAt > oneMonthAgo;
      })
      .reduce((sum, p) => sum + p.amount, 0);

    // Storage stats
    const allUploads = await prisma.upload.findMany({
      where: { status: 'active' },
    });

    const totalStorageBytes = allUploads.reduce(
      (sum, u) => sum + Number(u.fileSizeBytes),
      0
    );

    res.json({
      stats: {
        totalUploads,
        totalDownloads,
        totalUsers,
        activeSubscribers,
        totalRevenue: totalRevenue / 100, // Convert cents to dollars
        monthlyRevenue: monthlyRevenue / 100,
        totalStorageBytes,
        averageStoragePerUser: Math.round(totalStorageBytes / totalUsers / (1024 ** 3) * 100) / 100,
      },
    });
  }

  static async listUsers(req: AuthRequest, res: Response) {
    if (!req.isAdmin) {
      throw new ForbiddenError('Admin access required');
    }

    const { search, page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = search
      ? { email: { contains: String(search), mode: 'insensitive' as const } }
      : {};

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        storageUsedBytes: true,
        subscriptionStatus: true,
        createdAt: true,
      },
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.user.count({ where });

    res.json({
      users: users.map(u => ({
        ...u,
        storageUsedBytes: Number(u.storageUsedBytes),
      })),
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  }

  static async searchUploads(req: AuthRequest, res: Response) {
    if (!req.isAdmin) {
      throw new ForbiddenError('Admin access required');
    }

    const { filename, userId, minSize, maxSize, page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (filename) {
      where.filename = { contains: String(filename), mode: 'insensitive' };
    }

    if (userId) {
      where.userId = String(userId);
    }

    if (minSize) {
      where.fileSizeBytes = { gte: BigInt(String(minSize)) };
    }

    if (maxSize) {
      where.fileSizeBytes = { ...(where.fileSizeBytes || {}), lte: BigInt(String(maxSize)) };
    }

    const uploads = await prisma.upload.findMany({
      where,
      include: { user: { select: { email: true, name: true } } },
      skip,
      take: Number(limit),
      orderBy: { uploadedAt: 'desc' },
    });

    const total = await prisma.upload.count({ where });

    res.json({
      uploads: uploads.map(u => ({
        ...u,
        fileSizeBytes: Number(u.fileSizeBytes),
        user: u.user,
      })),
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
      },
    });
  }

  static async deleteUserData(req: AuthRequest, res: Response) {
    if (!req.isAdmin) {
      throw new ForbiddenError('Admin access required');
    }

    const { userId, reason } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User');
    }

    // Delete all uploads and files
    const uploads = await prisma.upload.findMany({
      where: { userId, status: 'active' },
    });

    const { S3Service } = await import('../services/S3Service');
    for (const upload of uploads) {
      await S3Service.deleteFile(upload.s3Key);
    }

    // Mark uploads as deleted
    await prisma.upload.updateMany({
      where: { userId },
      data: { status: 'deleted', deletedAt: new Date() },
    });

    // Log admin action
    await prisma.adminLog.create({
      data: {
        action: 'user_deletion',
        targetUserId: userId,
        reason,
      },
    });

    res.json({ message: 'User data deleted successfully' });
  }
}
