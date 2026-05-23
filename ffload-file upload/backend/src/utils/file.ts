import crypto from 'crypto';

export function generateFileHash(data: Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function generateS3Key(userId: string, filename: string): string {
  const timestamp = Date.now();
  const randomId = crypto.randomBytes(8).toString('hex');
  const ext = filename.split('.').pop();
  return `uploads/${userId}/${timestamp}-${randomId}.${ext}`;
}

export function generateUploadId(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function generateDownloadToken(uploadId: string): string {
  return crypto.randomBytes(32).toString('hex');
}
