import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function initializePackages() {
  try {
    console.log('Initializing tournament packages...');

    // Default packages data
    const defaultPackages = [
      {
        packageType: 'FREE',
        name: 'Free Package',
        description: 'Perfect for beginners and small tournaments',
        price: 0,
        currency: 'USD',
        features: JSON.stringify([
          '1 tournament per week',
          'Basic bracket types (Single/Double Elimination, Swiss)',
          'Team registration management',
          'Basic tournament hosting'
        ]),
        color: '#3B82F6',
        isActive: true,
        isEditable: false // FREE package cannot be edited
      },
      {
        packageType: 'PAID_GRAPHICS',
        name: 'Graphics Package',
        description: 'Professional tournaments with custom graphics',
        price: 29,
        currency: 'USD',
        features: JSON.stringify([
          'All Free features',
          'Logo creation',
          'Professional graphic design',
          'Multiple bracket types (Group Stage, Leaderboard)',
          'Custom graphic requests',
          'Priority support'
        ]),
        color: '#8B5CF6',
        isActive: true,
        isEditable: true
      },
      {
        packageType: 'PAID_DISCORD_BOT',
        name: 'Discord Package',
        description: 'Complete solution with Discord integration',
        price: 49,
        currency: 'USD',
        features: JSON.stringify([
          'All Graphics features',
          'Discord server setup help',
          'Custom chat bot',
          'Automated tournament management',
          'Real-time notifications',
          'Discord integration'
        ]),
        color: '#10B981',
        isActive: true,
        isEditable: true
      },
      {
        packageType: 'FULL_MANAGEMENT',
        name: 'Full Management',
        description: 'Premium experience with complete management',
        price: 99,
        currency: 'USD',
        features: JSON.stringify([
          'All Discord features',
          'Admin-player chat system',
          'Social media management',
          'Professional advertising',
          'Video editing services',
          '24/7 dedicated support',
          'Tournament promotion'
        ]),
        color: '#F59E0B',
        isActive: true,
        isEditable: true
      }
    ];

    // Create or update packages
    for (const pkgData of defaultPackages) {
      const existingPackage = await prisma.packagePrice.findUnique({
        where: { packageType: pkgData.packageType }
      });

      if (existingPackage) {
        // Update existing package with new fields
        await prisma.packagePrice.update({
          where: { packageType: pkgData.packageType },
          data: {
            name: pkgData.name,
            description: pkgData.description,
            features: pkgData.features,
            color: pkgData.color,
            isEditable: pkgData.isEditable
          }
        });
        console.log(`Updated package: ${pkgData.packageType}`);
      } else {
        // Create new package
        await prisma.packagePrice.create({
          data: {
            ...pkgData,
            updatedBy: 'system' // This will be replaced with actual admin user ID in production
          }
        });
        console.log(`Created package: ${pkgData.packageType}`);
      }
    }

    console.log('Package initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing packages:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the initialization
initializePackages();