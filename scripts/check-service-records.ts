import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkServiceRecords() {
  console.log('🔍 Checking service-related records...');
  
  try {
    // Check service orders
    const serviceOrderCount = await prisma.serviceOrder.count();
    console.log(`📊 Service orders: ${serviceOrderCount}`);
    
    // Check service order payments
    const servicePaymentCount = await prisma.payment.count({
      where: {
        serviceOrderId: {
          not: null
        }
      }
    });
    console.log(`📊 Service order payments: ${servicePaymentCount}`);
    
    // Check services
    const serviceCount = await prisma.service.count();
    console.log(`📊 Services: ${serviceCount}`);
    
    // Check service-related notifications
    const serviceNotificationCount = await prisma.notification.count({
      where: {
        type: 'SERVICE_ORDER'
      }
    });
    console.log(`📊 Service-related notifications: ${serviceNotificationCount}`);
    
    console.log('\n✅ Service records check completed!');
    
    if (serviceOrderCount > 0 || servicePaymentCount > 0) {
      console.log('⚠️  There are service-related records that might need cleanup.');
      console.log('💡 Would you like to clean these as well?');
    } else {
      console.log('🎉 No service-related records found that need cleanup.');
    }
    
  } catch (error) {
    console.error('❌ Error checking service records:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkServiceRecords()
  .then(() => {
    console.log('\n🔍 Service records check completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Service records check failed:', error);
    process.exit(1);
  });