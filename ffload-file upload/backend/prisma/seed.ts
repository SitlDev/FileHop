// Initialize database with admin user
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@knotstranded.com';
  const adminExists = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('change-me-in-production', 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Admin',
        password: hashedPassword,
        subscriptionStatus: 'active',
        storageQuotaBytes: 0n, // Admins have unlimited storage
      },
    });
    console.log(`Admin user created: ${adminEmail}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
