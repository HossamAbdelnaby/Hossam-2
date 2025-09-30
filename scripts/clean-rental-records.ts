import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanRentalRecords() {
  console.log('🧹 Starting to clean rental records...');
  
  try {
    // Step 1: Clean Player Rental (Pusher) Records
    console.log('\n📋 Cleaning Player Rental (Pusher) Records...');
    
    // Delete messages related to pushers
    const pusherMessages = await prisma.message.deleteMany({
      where: {
        pusherId: {
          not: null
        }
      }
    });
    console.log(`🗑️  Deleted ${pusherMessages.count} pusher-related messages`);
    
    // Delete payments related to contracts
    const contractPayments = await prisma.payment.deleteMany({
      where: {
        contractId: {
          not: null
        }
      }
    });
    console.log(`🗑️  Deleted ${contractPayments.count} contract-related payments`);
    
    // Delete all contracts
    const contracts = await prisma.contract.deleteMany({});
    console.log(`🗑️  Deleted ${contracts.count} contracts`);
    
    // Delete all pusher profiles
    const pushers = await prisma.pusher.deleteMany({});
    console.log(`🗑️  Deleted ${pushers.count} pusher profiles`);
    
    // Step 2: Clean Clan Rental (CWL) Records
    console.log('\n🏰 Cleaning Clan Rental (CWL) Records...');
    
    // Delete clan applications
    const clanApplications = await prisma.clanApplication.deleteMany({});
    console.log(`🗑️  Deleted ${clanApplications.count} clan applications`);
    
    // Delete clan members
    const clanMembers = await prisma.clanMember.deleteMany({});
    console.log(`🗑️  Deleted ${clanMembers.count} clan members`);
    
    // Delete all clans
    const clans = await prisma.clan.deleteMany({});
    console.log(`🗑️  Deleted ${clans.count} clans`);
    
    // Step 3: Clean related notifications
    console.log('\n🔔 Cleaning related notifications...');
    
    const contractNotifications = await prisma.notification.deleteMany({
      where: {
        type: {
          in: ['CONTRACT_STATUS', 'SERVICE_ORDER']
        }
      }
    });
    console.log(`🗑️  Deleted ${contractNotifications.count} related notifications`);
    
    console.log('\n✅ All rental records have been successfully cleaned!');
    console.log('📊 Summary:');
    console.log(`   - Pusher Messages: ${pusherMessages.count}`);
    console.log(`   - Contract Payments: ${contractPayments.count}`);
    console.log(`   - Contracts: ${contracts.count}`);
    console.log(`   - Pushers: ${pushers.count}`);
    console.log(`   - Clan Applications: ${clanApplications.count}`);
    console.log(`   - Clan Members: ${clanMembers.count}`);
    console.log(`   - Clans: ${clans.count}`);
    console.log(`   - Related Notifications: ${contractNotifications.count}`);
    
  } catch (error) {
    console.error('❌ Error cleaning rental records:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanRentalRecords()
  .then(() => {
    console.log('\n🎉 Cleanup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Cleanup failed:', error);
    process.exit(1);
  });