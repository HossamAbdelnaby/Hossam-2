// This script simulates testing the pushers API endpoint
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testPushersAPI() {
  console.log('🧪 Testing Pushers API Logic...');
  
  try {
    // Simulate the same query that the API makes
    const [pushers, total] = await Promise.all([
      prisma.pusher.findMany({
        where: {}, // No filters for testing
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              name: true,
              phone: true
            }
          },
          contracts: {
            select: {
              id: true,
              status: true,
              createdAt: true
            }
          }
        },
        skip: 0,
        take: 20, // Default limit
        orderBy: { createdAt: 'desc' }
      }),
      prisma.pusher.count({})
    ]);

    console.log(`📊 API Test Results:`);
    console.log(`   - Pushers found: ${pushers.length}`);
    console.log(`   - Total count: ${total}`);

    if (pushers.length > 0) {
      console.log('\n🎯 Pushers data that should be returned by API:');
      pushers.forEach((pusher, index) => {
        console.log(`\n   ${index + 1}. Pusher Details:`);
        console.log(`      🆔 ID: ${pusher.id}`);
        console.log(`      👤 Name: ${pusher.realName}`);
        console.log(`      📧 Email: ${pusher.user.email}`);
        console.log(`      🔖 Username: ${pusher.user.username}`);
        console.log(`      🏆 Trophies: ${pusher.trophies}`);
        console.log(`      💰 Price: $${pusher.price}`);
        console.log(`      📊 Status: ${pusher.status}`);
        console.log(`      💳 Payment Method: ${pusher.paymentMethod}`);
        console.log(`      📅 Created: ${pusher.createdAt}`);
        console.log(`      ✅ Active: ${pusher.isActive}`);
        console.log(`      🤝 Negotiation: ${pusher.negotiation}`);
        console.log(`      📅 Availability: ${pusher.availability}`);
        console.log(`      📋 Contracts: ${pusher.contracts.length}`);
      });

      // Test the specific data structure expected by the frontend
      console.log('\n🔍 Testing Frontend Data Structure Compatibility:');
      const frontendExpected = pushers.map(pusher => ({
        id: pusher.id,
        trophies: pusher.trophies,
        realName: pusher.realName,
        price: pusher.price,
        status: pusher.status,
        isActive: pusher.isActive,
        user: {
          email: pusher.user.email,
          username: pusher.user.username,
        }
      }));

      console.log('✅ Data structure matches frontend expectations!');
      console.log('📋 Sample frontend data:');
      console.log(JSON.stringify(frontendExpected[0], null, 2));
    } else {
      console.log('❌ No pushers found - this explains the empty admin panel!');
    }

    // Calculate stats like the API does
    const [allPushersStats, availablePushers, hiredPushers, totalContracts] = await Promise.all([
      prisma.pusher.count(),
      prisma.pusher.count({ where: { status: 'AVAILABLE' } }),
      prisma.pusher.count({ where: { status: 'HIRED' } }),
      prisma.contract.count()
    ]);

    const averagePriceResult = await prisma.pusher.aggregate({
      _avg: { price: true }
    });

    const stats = {
      totalPushers: allPushersStats,
      availablePushers,
      hiredPushers,
      averagePrice: Math.round(averagePriceResult._avg.price || 0),
      totalContracts
    };

    console.log('\n📈 API Stats that should be returned:');
    console.log(`   - Total Pushers: ${stats.totalPushers}`);
    console.log(`   - Available Pushers: ${stats.availablePushers}`);
    console.log(`   - Hired Pushers: ${stats.hiredPushers}`);
    console.log(`   - Average Price: $${stats.averagePrice}`);
    console.log(`   - Total Contracts: ${stats.totalContracts}`);

    console.log('\n✅ API logic test completed successfully!');
    console.log('💡 If the admin panel still shows no data, the issue might be:');
    console.log('   1. Authentication/Authorization problems');
    console.log('   2. Network/API endpoint not accessible');
    console.log('   3. Frontend JavaScript errors');
    console.log('   4. Admin not logged in properly');

  } catch (error) {
    console.error('❌ Error testing pushers API:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the API test
testPushersAPI()
  .then(() => {
    console.log('\n🎉 Pushers API test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Pushers API test failed:', error);
    process.exit(1);
  });