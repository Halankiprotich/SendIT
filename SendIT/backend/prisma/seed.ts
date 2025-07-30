import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@sendit.com';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const password = await bcrypt.hash('admin123', 10);

    await prisma.user.create({
      data: {
        email: adminEmail,
        password,
        name: 'Admin',
        role: UserRole.ADMIN,
        isActive: true, // Added required field
        phone: null,    // Optional field explicitly set
      },
    });

    console.log('✅ Admin user created');
  } else {
    console.log('⚠️ Admin already exists');
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