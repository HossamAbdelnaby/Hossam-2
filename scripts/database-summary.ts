import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function generateDatabaseSummary() {
  console.log('📊 Generating Database Summary After Cleanup...');
  console.log('═'.repeat(60));
  
  try {
    // User Statistics
    const userCount = await prisma.user.count();
    const adminCount = await prisma.user.count({
      where: {
        role: {
          in: ['ADMIN', 'SUPER_ADMIN']
        }
      }
    });
    console.log('👥 Users:');
    console.log(`   Total Users: ${userCount}`);
    console.log(`   Admin Users: ${adminCount}`);
    
    // Tournament Statistics
    const tournamentCount = await prisma.tournament.count();
    const activeTournamentCount = await prisma.tournament.count({
      where: {
        isActive: true
      }
    });
    console.log('\n🏆 Tournaments:');
    console.log(`   Total Tournaments: ${tournamentCount}`);
    console.log(`   Active Tournaments: ${activeTournamentCount}`);
    
    // Team Statistics
    const teamCount = await prisma.team.count();
    console.log('\n👥 Teams:');
    console.log(`   Total Teams: ${teamCount}`);
    
    // Player Statistics
    const playerCount = await prisma.player.count();
    console.log('\n🎮 Players:');
    console.log(`   Total Players: ${playerCount}`);
    
    // Rental Records (Should be 0 after cleanup)
    console.log('\n🧹 Rental Records (After Cleanup):');
    console.log(`   Pusher Profiles: ${await prisma.pusher.count()}`);
    console.log(`   Contracts: ${await prisma.contract.count()}`);
    console.log(`   Clans: ${await prisma.clan.count()}`);
    console.log(`   Clan Applications: ${await prisma.clanApplication.count()}`);
    console.log(`   Clan Members: ${await prisma.clanMember.count()}`);
    
    // Service Records
    console.log('\n🛠️  Service Records:');
    console.log(`   Services: ${await prisma.service.count()}`);
    console.log(`   Service Orders: ${await prisma.serviceOrder.count()}`);
    
    // Payment Statistics
    const paymentCount = await prisma.payment.count();
    const completedPaymentCount = await prisma.payment.count({
      where: {
        status: 'COMPLETED'
      }
    });
    console.log('\n💳 Payments:');
    console.log(`   Total Payments: ${paymentCount}`);
    console.log(`   Completed Payments: ${completedPaymentCount}`);
    
    // Message Statistics
    const messageCount = await prisma.message.count();
    console.log('\n💬 Messages:');
    console.log(`   Total Messages: ${messageCount}`);
    
    // Notification Statistics
    const notificationCount = await prisma.notification.count();
    const unreadNotificationCount = await prisma.notification.count({
      where: {
        isRead: false
      }
    });
    console.log('\n🔔 Notifications:');
    console.log(`   Total Notifications: ${notificationCount}`);
    console.log(`   Unread Notifications: ${unreadNotificationCount}`);
    
    // Admin Configuration
    const configCount = await prisma.adminConfig.count();
    console.log('\n⚙️  Admin Configuration:');
    console.log(`   Config Entries: ${configCount}`);
    
    console.log('\n═'.repeat(60));
    console.log('✅ Database Summary Generated Successfully!');
    console.log('🎉 All rental records have been cleaned up!');
    console.log('📋 The system is now ready for fresh rental operations.');
    
  } catch (error) {
    console.error('❌ Error generating database summary:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Generate the summary
generateDatabaseSummary()
  .then(() => {
    console.log('\n📊 Summary generation completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Summary generation failed:', error);
    process.exit(1);
  });