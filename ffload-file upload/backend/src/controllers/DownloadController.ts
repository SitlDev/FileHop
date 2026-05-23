import { Response } from 'express';
import { validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';
import { S3Service } from '../services/S3Service';
import { QRCodeService } from '../services/QRCodeService';
import { EmailService } from '../services/EmailService';

const prisma = new PrismaClient();

export class DownloadController {
  static async getDownloadLink(req: AuthRequest, res: Response) {
    const { uploadId } = req.params;

    const upload = await prisma.upload.findUnique({
      where: { id: uploadId },
      include: { user: true },
    });

    if (!upload || upload.status === 'deleted') {
      throw new NotFoundError('Upload');
    }

    // Check if expired
    if (new Date() > upload.expiresAt) {
      throw new NotFoundError('Upload');
    }

    // Generate signed URL
    const signedUrl = await S3Service.getSignedUrl(upload.s3Key, 604800); // 7 days

    // Increment download count
    await prisma.upload.update({
      where: { id: uploadId },
      data: { downloadCount: { increment: 1 } },
    });

    // Log download
    await prisma.downloadLog.create({
      data: {
        uploadId,
        userId: req.userId || null,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('user-agent'),
      },
    });

    const daysRemaining = Math.ceil(
      (upload.expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    res.json({
      filename: upload.filename,
      fileSizeBytes: Number(upload.fileSizeBytes),
      downloadUrl: signedUrl,
      expiresAt: upload.expiresAt,
      daysRemaining,
      downloadCount: upload.downloadCount + 1,
    });
  }

  static async getQRCode(req: AuthRequest, res: Response) {
    const { uploadId } = req.params;

    const upload = await prisma.upload.findUnique({ where: { id: uploadId } });
    if (!upload || upload.status === 'deleted') {
      throw new NotFoundError('Upload');
    }

    // Create shareable download link
    const downloadLink = `${process.env.FRONTEND_URL}/download/${uploadId}`;

    // Generate QR code
    const qrCodeDataUrl = await QRCodeService.generateQRCode(downloadLink);

    res.json({
      qrCode: qrCodeDataUrl,
      downloadLink,
    });
  }

  static async shareViaEmail(req: AuthRequest, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const { uploadId } = req.params;
    const { recipientEmail } = req.body;
    const userId = req.userId;

    const upload = await prisma.upload.findUnique({
      where: { id: uploadId },
      include: { user: true },
    });

    if (!upload || upload.status === 'deleted') {
      throw new NotFoundError('Upload');
    }

    if (upload.userId !== userId && userId) {
      throw new ForbiddenError('Cannot share another user\'s file');
    }

    // Create shareable download link
    const downloadLink = `${process.env.FRONTEND_URL}/download/${uploadId}`;

    // Generate QR code
    const qrCodeDataUrl = await QRCodeService.generateQRCode(downloadLink);

    // Send email with download link and QR code
    await EmailService.sendDownloadLink(
      recipientEmail,
      upload.filename,
      downloadLink,
      qrCodeDataUrl
    );

    res.json({
      message: `Download link sent to ${recipientEmail}`,
    });
  }

  static async getPublicDownloadPage(req: AuthRequest, res: Response) {
    const { uploadId } = req.params;

    const upload = await prisma.upload.findUnique({
      where: { id: uploadId },
    });

    if (!upload || upload.status === 'deleted') {
      throw new NotFoundError('Upload');
    }

    // Check if expired
    if (new Date() > upload.expiresAt) {
      throw new NotFoundError('Upload (expired)');
    }

    const daysRemaining = Math.ceil(
      (upload.expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    res.json({
      filename: upload.filename,
      fileSizeBytes: Number(upload.fileSizeBytes),
      uploadedAt: upload.uploadedAt,
      expiresAt: upload.expiresAt,
      daysRemaining,
      downloadCount: upload.downloadCount,
    });
  }
}
