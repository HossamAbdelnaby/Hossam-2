const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        username: 'admin',
        password: hashedPassword,
        name: 'Admin User',
        role: 'SUPER_ADMIN',
        language: 'en'
      }
    });

    console.log('Test user created successfully:', {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    });

    // Create another test user with USER role
    const regularUser = await prisma.user.create({
      data: {
        email: 'user@example.com',
        username: 'user',
        password: hashedPassword,
        name: 'Regular User',
        role: 'USER',
        language: 'en'
      }
    });

    console.log('Regular user created successfully:', {
      id: regularUser.id,
      email: regularUser.email,
      username: regularUser.username,
      role: regularUser.role
    });

  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();