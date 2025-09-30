import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';
import { db } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function getAuthUser(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
    
    return {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };
  } catch (error) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get system status (mock data for now, in production you'd get real system metrics)
    const uptime = process.uptime();
    
    // Get user count
    const userCount = await db.user.count();
    
    // Get tournament count
    const tournamentCount = await db.tournament.count();
    
    // Mock system metrics (in production, you'd use system libraries like 'os')
    const systemStatus = {
      uptime: Math.floor(uptime).toString(),
      memoryUsage: {
        used: Math.floor(Math.random() * 4 * 1024 * 1024 * 1024), // Random between 0-4GB
        total: 8 * 1024 * 1024 * 1024, // 8GB
        percentage: Math.floor(Math.random() * 100)
      },
      diskUsage: {
        used: Math.floor(Math.random() * 50 * 1024 * 1024 * 1024), // Random between 0-50GB
        total: 100 * 1024 * 1024 * 1024, // 100GB
        percentage: Math.floor(Math.random() * 100)
      },
      cpuUsage: Math.floor(Math.random() * 100),
      activeUsers: Math.floor(userCount * 0.3), // Assume 30% are active
      databaseConnections: Math.floor(Math.random() * 50) + 10,
      totalUsers: userCount,
      totalTournaments: tournamentCount
    };

    return NextResponse.json({
      message: 'System status retrieved successfully',
      status: systemStatus,
    });
  } catch (error) {
    console.error('Error getting system status:', error);
    return NextResponse.json(
      { error: 'Failed to get system status' },
      { status: 500 }
    );
  }
}