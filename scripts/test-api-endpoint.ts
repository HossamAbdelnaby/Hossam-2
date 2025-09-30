import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function testAPIEndpoint() {
  console.log('🌐 Testing API Endpoint Directly...');
  
  try {
    // Find an admin user to test with
    const adminUser = await prisma.user.findFirst({
      where: {
        role: {
          in: ['ADMIN', 'SUPER_ADMIN']
        }
      }
    });

    if (!adminUser) {
      console.log('❌ No admin user found in database');
      return;
    }

    console.log(`👤 Found admin user: ${adminUser.username} (${adminUser.email})`);
    console.log(`🔑 Role: ${adminUser.role}`);

    // Create a JWT token like the authentication system does
    const token = jwt.sign(
      { 
        userId: adminUser.id, 
        email: adminUser.email, 
        role: adminUser.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('🎫 JWT token created successfully');
    console.log(`🆔 User ID: ${adminUser.id}`);

    // Test the API endpoint logic without HTTP (simulate the request processing)
    console.log('\n🧪 Simulating API request processing...');
    
    // This simulates what happens in the API endpoint
    const [pushers, total] = await Promise.all([
      prisma.pusher.findMany({
        where: {},
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
        take: 10,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.pusher.count({})
    ]);

    const totalPages = Math.ceil(total / 10);

    // Calculate stats
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

    // This is what the API should return
    const apiResponse = {
      message: 'Pushers retrieved successfully',
      pushers,
      total,
      page: 1,
      limit: 10,
      totalPages,
      stats
    };

    console.log('✅ API endpoint simulation successful!');
    console.log(`📊 Response would contain ${pushers.length} pushers`);
    console.log(`📈 Stats:`, stats);

    if (pushers.length > 0) {
      console.log('\n🎯 First pusher in response:');
      const firstPusher = pushers[0];
      console.log(`   👤 Name: ${firstPusher.realName}`);
      console.log(`   🔖 Username: ${firstPusher.user.username}`);
      console.log(`   🏆 Trophies: ${firstPusher.trophies}`);
      console.log(`   💰 Price: $${firstPusher.price}`);
      console.log(`   📊 Status: ${firstPusher.status}`);
    }

    console.log('\n💡 Troubleshooting Tips:');
    console.log('1. Make sure you are logged in as an admin');
    console.log('2. Check browser console for JavaScript errors');
    console.log('3. Verify the API endpoint is accessible at /api/admin/pushers');
    console.log('4. Check that authentication cookies are set properly');
    console.log('5. Try accessing the admin panel in a new private/incognito window');

    console.log('\n🔧 To test manually:');
    console.log('1. Log in as an admin user');
    console.log('2. Go to /admin/pushers');
    console.log('3. Open browser dev tools (F12)');
    console.log('4. Check Network tab for API requests');
    console.log('5. Look for requests to /api/admin/pushers');

  } catch (error) {
    console.error('❌ Error testing API endpoint:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testAPIEndpoint()
  .then(() => {
    console.log('\n🎉 API endpoint test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 API endpoint test failed:', error);
    process.exit(1);
  });