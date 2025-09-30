import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyCleanup() {
  console.log('🔍 Verifying rental records cleanup...');
  
  try {
    // Check pusher records
    const pusherCount = await prisma.pusher.count();
    console.log(`📊 Pusher profiles remaining: ${pusherCount}`);
    
    // Check contract records
    const contractCount = await prisma.contract.count();
    console.log(`📊 Contracts remaining: ${contractCount}`);
    
    // Check clan records
    const clanCount = await prisma.clan.count();
    console.log(`📊 Clans remaining: ${clanCount}`);
    
    // Check clan application records
    const clanApplicationCount = await prisma.clanApplication.count();
    console.log(`📊 Clan applications remaining: ${clanApplicationCount}`);
    
    // Check clan member records
    const clanMemberCount = await prisma.clanMember.count();
    console.log(`📊 Clan members remaining: ${clanMemberCount}`);
    
    // Check pusher-related messages
    const pusherMessageCount = await prisma.message.count({
      where: {
        pusherId: {
          not: null
        }
      }
    });
    console.log(`📊 Pusher-related messages remaining: ${pusherMessageCount}`);
    
    // Check contract-related payments
    const contractPaymentCount = await prisma.payment.count({
      where: {
        contractId: {
          not: null
        }
      }
    });
    console.log(`📊 Contract-related payments remaining: ${contractPaymentCount}`);
    
    // Check related notifications
    const relatedNotificationCount = await prisma.notification.count({
      where: {
        type: {
          in: ['CONTRACT_STATUS', 'SERVICE_ORDER']
        }
      }
    });
    console.log(`📊 Related notifications remaining: ${relatedNotificationCount}`);
    
    console.log('\n✅ Verification completed!');
    
    if (pusherCount === 0 && contractCount === 0 && clanCount === 0 && 
        clanApplicationCount === 0 && clanMemberCount === 0 && 
        pusherMessageCount === 0 && contractPaymentCount === 0) {
      console.log('🎉 All rental records have been successfully cleaned!');
    } else {
      console.log('⚠️  Some rental records still remain. Please check the counts above.');
    }
    
  } catch (error) {
    console.error('❌ Error verifying cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
verifyCleanup()
  .then(() => {
    console.log('\n🔍 Verification completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Verification failed:', error);
    process.exit(1);
  });