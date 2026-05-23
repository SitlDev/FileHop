import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand, HeadObjectCommandOutput } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ReadStream } from 'fs';

// In-memory mock storage for development/testing
const mockStorage = new Map<string, Buffer>();

const isTestMode = process.env.NODE_ENV === 'test' || !process.env.AWS_ACCESS_KEY_ID;

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test-key',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test-secret',
  },
  ...(process.env.S3_ENDPOINT && {
    endpoint: `https://${process.env.S3_ENDPOINT}`,
    forcePathStyle: true,
  }),
});

if (!isTestMode) {
  console.log('✅ Backblaze B2 storage enabled');
  console.log(`   Endpoint: https://${process.env.S3_ENDPOINT}`);
  console.log(`   Bucket: ${process.env.S3_BUCKET_NAME}`);
} else {
  console.log('⚠️  Using mock storage (development mode)');
}

export class S3Service {
  static async uploadFile(
    key: string,
    fileStream: Buffer | ReadStream,
    mimetype: string
  ): Promise<string> {
    // Convert stream to buffer if needed
    let buffer: Buffer;
    if (Buffer.isBuffer(fileStream)) {
      buffer = fileStream;
    } else {
      buffer = await new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        fileStream.on('data', chunk => chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk));
        fileStream.on('end', () => resolve(Buffer.concat(chunks)));
        fileStream.on('error', reject);
      });
    }

    if (isTestMode) {
      // Use mock storage for testing
      mockStorage.set(key, buffer);
      return `s3://mock/${key}`;
    }

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME || 'filehop-uploads',
      Key: key,
      Body: buffer,
      ContentType: mimetype,
      ServerSideEncryption: 'AES256',
    });

    const result = await s3Client.send(command);
    
    // For S3-compatible services, construct the URL manually
    const bucketName = process.env.S3_BUCKET_NAME || 'filehop-uploads';
    const endpoint = process.env.S3_ENDPOINT || `s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com`;
    return `https://${bucketName}.${endpoint}/${key}`;
  }

  static async getSignedUrl(key: string, expiresIn = 604800): Promise<string> {
    // 7 days default, matching file retention
    if (isTestMode) {
      // In test mode, return a mock URL
      return `http://localhost:5000/api/mock-download/${key}`;
    }

    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME || 'filehop-uploads',
      Key: key,
    });

    return getSignedUrl(s3Client, command, { expiresIn });
  }

  static async deleteFile(key: string): Promise<void> {
    if (isTestMode) {
      mockStorage.delete(key);
      return;
    }

    const command = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME || 'filehop-uploads',
      Key: key,
    });

    await s3Client.send(command);
  }

  static async headObject(key: string): Promise<HeadObjectCommandOutput> {
    if (isTestMode) {
      // Mock head object response
      const size = mockStorage.get(key)?.length || 0;
      return {
        ContentLength: size,
        LastModified: new Date(),
      } as any;
    }

    const command = new HeadObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME || 'filehop-uploads',
      Key: key,
    });

    return s3Client.send(command);
  }
}
