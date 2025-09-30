import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testPusherData() {
  console.log('🔍 Testing Pusher Data...');
  
  try {
    // Check current pusher count
    const pusherCount = await prisma.pusher.count();
    console.log(`📊 Current pusher count: ${pusherCount}`);
    
    // Get all users to see available users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true
      }
    });
    console.log(`👥 Total users in database: ${users.length}`);
    
    // Show users that could be pushers
    const regularUsers = users.filter(user => user.role === 'USER');
    console.log(`🎮 Regular users (potential pushers): ${regularUsers.length}`);
    
    if (regularUsers.length > 0) {
      console.log('\n📋 Available regular users:');
      regularUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name || user.username} (${user.email}) - ID: ${user.id}`);
      });
    }
    
    // Check if there are any pusher profiles
    const pushers = await prisma.pusher.findMany({
      include: {
        user: {
          select: {
            email: true,
            username: true,
            name: true
          }
        }
      }
    });
    
    if (pushers.length > 0) {
      console.log('\n🎯 Existing pusher profiles:');
      pushers.forEach((pusher, index) => {
        console.log(`   ${index + 1}. ${pusher.realName} (${pusher.user.username}) - Trophies: ${pusher.trophies}, Price: $${pusher.price}`);
      });
    } else {
      console.log('\n❌ No pusher profiles found in database');
      console.log('💡 This explains why the admin panel shows no data!');
    }
    
    // Test creating a sample pusher profile
    if (regularUsers.length > 0 && pushers.length === 0) {
      console.log('\n🧪 Creating a sample pusher profile for testing...');
      
      const testUser = regularUsers[0];
      const samplePusher = await prisma.pusher.create({
        data: {
          trophies: 5500,
          realName: testUser.name || testUser.username,
          price: 25.00,
          paymentMethod: 'PAYPAL',
          negotiation: false,
          availability: 'STAY',
          status: 'AVAILABLE',
          userId: testUser.id
        },
        include: {
          user: {
            select: {
              email: true,
              username: true,
              name: true
            }
          }
        }
      });
      
      console.log('✅ Sample pusher profile created successfully!');
      console.log(`   📝 Name: ${samplePusher.realName}`);
      console.log(`   👤 User: ${samplePusher.user.username}`);
      console.log(`   🏆 Trophies: ${samplePusher.trophies}`);
      console.log(`   💰 Price: $${samplePusher.price}`);
      console.log(`   📊 Status: ${samplePusher.status}`);
      
      // Verify the pusher was created
      const newPusherCount = await prisma.pusher.count();
      console.log(`\n📊 New pusher count: ${newPusherCount}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing pusher data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testPusherData()
  .then(() => {
    console.log('\n🎉 Pusher data test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Pusher data test failed:', error);
    process.exit(1);
  });