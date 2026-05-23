import { Response } from 'express';
import { validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { ValidationError, NotFoundError, QuotaError, ForbiddenError } from '../utils/errors';
import { S3Service } from '../services/S3Service';
import { config } from '../utils/config';

const prisma = new PrismaClient();

export class UploadController {
  static async createUpload(req: AuthRequest, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const { filename, fileSizeBytes, mimeType, fileHash, fileBuffer } = req.body;
    const userId = req.userId!;

    // Convert base64 string to Buffer if needed
    let buffer: Buffer;
    if (typeof fileBuffer === 'string') {
      buffer = Buffer.from(fileBuffer, 'base64');
    } else if (Buffer.isBuffer(fileBuffer)) {
      buffer = fileBuffer;
    } else {
      throw new ValidationError('Invalid file buffer format');
    }

    // Get user and check quota
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User');
    }

    // Check file size limit
    if (fileSizeBytes > config.MAX_FILE_SIZE) {
      throw new ValidationError(`File exceeds maximum size of 500MB`);
    }

    // Check storage quota
    const newStorageUsed = user.storageUsedBytes + BigInt(fileSizeBytes);
    if (newStorageUsed > BigInt(config.USER_STORAGE_LIMIT)) {
      throw new QuotaError(
        `Storage limit exceeded. Current: ${user.storageUsedBytes}B, Requested: +${fileSizeBytes}B, Limit: ${config.USER_STORAGE_LIMIT}B`
      );
    }

    // Check for duplicate file (by hash)
    const existingUpload = await prisma.upload.findUnique({
      where: { fileHash },
    });

    let upload;
    let s3Url;

    if (existingUpload && existingUpload.userId === userId && existingUpload.status === 'active') {
      // Reuse existing file
      upload = existingUpload;
      s3Url = existingUpload.s3Url;
    } else {
      // Upload new file to S3
      const { generateS3Key } = await import('../utils/file');
      const s3Key = generateS3Key(userId, filename);

      s3Url = await S3Service.uploadFile(s3Key, buffer, mimeType);

      // Create upload record
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + config.FILE_RETENTION_DAYS);

      upload = await prisma.upload.create({
        data: {
          userId,
          filename,
          fileSizeBytes: BigInt(fileSizeBytes),
          fileHash,
          mimeType,
          s3Key,
          s3Url,
          status: 'active',
          expiresAt,
        },
      });
    }

    // Update user storage
    await prisma.user.update({
      where: { id: userId },
      data: {
        storageUsedBytes: newStorageUsed,
      },
    });

    // Check if approaching quota (90%)
    const quotaPercent = Number(newStorageUsed) / config.USER_STORAGE_LIMIT;
    if (quotaPercent >= 0.9) {
      const { EmailService } = await import('../services/EmailService');
      await EmailService.sendStorageWarning(
        user.email,
        Math.round(Number(newStorageUsed) / (1024 ** 3) * 10) / 10,
        Math.round(config.USER_STORAGE_LIMIT / (1024 ** 3))
      );
    }

    res.status(201).json({
      upload: {
        id: upload.id,
        filename: upload.filename,
        fileSizeBytes: Number(upload.fileSizeBytes),
        uploadedAt: upload.uploadedAt,
        expiresAt: upload.expiresAt,
      },
    });
  }

  static async listUploads(req: AuthRequest, res: Response) {
    const userId = req.userId!;

    const uploads = await prisma.upload.findMany({
      where: { 
        userId,
        status: { not: 'deleted' }
      },
      orderBy: { uploadedAt: 'desc' },
      select: {
        id: true,
        filename: true,
        fileSizeBytes: true,
        uploadedAt: true,
        expiresAt: true,
        downloadCount: true,
        status: true,
      },
    });

    res.json({
      uploads: uploads.map(u => ({
        ...u,
        fileSizeBytes: Number(u.fileSizeBytes),
      })),
    });
  }

  static async deleteUpload(req: AuthRequest, res: Response) {
    const { uploadId } = req.params;
    const userId = req.userId!;

    const upload = await prisma.upload.findUnique({ where: { id: uploadId } });
    if (!upload) {
      throw new NotFoundError('Upload');
    }

    if (upload.userId !== userId) {
      throw new ForbiddenError('Cannot delete another user\'s file');
    }

    // Delete from S3
    await S3Service.deleteFile(upload.s3Key);

    // Mark as deleted
    await prisma.upload.update({
      where: { id: uploadId },
      data: {
        status: 'deleted',
        deletedAt: new Date(),
      },
    });

    // Update user storage
    await prisma.user.update({
      where: { id: userId },
      data: {
        storageUsedBytes: {
          decrement: upload.fileSizeBytes,
        },
      },
    });

    res.json({ message: 'Upload deleted successfully' });
  }

  static async checkQuota(req: AuthRequest, res: Response) {
    const { uploadId } = req.params;
    const userId = req.userId!;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User');
    }

    const upload = await prisma.upload.findUnique({ where: { id: uploadId } });
    if (!upload) {
      throw new NotFoundError('Upload');
    }

    const wouldExceedQuota = user.storageUsedBytes + upload.fileSizeBytes > BigInt(config.USER_STORAGE_LIMIT);

    res.json({
      storageUsedBytes: user.storageUsedBytes.toString(),
      storageQuotaBytes: user.storageQuotaBytes.toString(),
      wouldExceedQuota,
      availableBytes: (BigInt(config.USER_STORAGE_LIMIT) - user.storageUsedBytes).toString(),
    });
  }
}
