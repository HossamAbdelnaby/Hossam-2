const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./db/custom.db',
    },
  },
});

async function checkUserRole() {
  try {
    const user = await prisma.user.findUnique({
      where: {
        email: 'HossamAbdelnaby3@Gmail.com',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    console.log('User found:', user);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserRole();