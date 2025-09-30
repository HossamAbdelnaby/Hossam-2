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

    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const filters = {
      search: searchParams.get('search') || '',
      status: searchParams.get('status') || '',
      availability: searchParams.get('availability') || '',
      minTrophies: searchParams.get('minTrophies') || '',
      maxPrice: searchParams.get('maxPrice') || ''
    };

    // Build where clause for filtering
    const where: any = {};
    
    if (filters.status) {
      where.status = filters.status;
    }
    
    if (filters.availability) {
      where.availability = filters.availability;
    }
    
    if (filters.minTrophies) {
      where.trophies = { gte: parseInt(filters.minTrophies) };
    }
    
    if (filters.maxPrice) {
      where.price = { lte: parseInt(filters.maxPrice) };
    }
    
    if (filters.search) {
      where.OR = [
        { realName: { contains: filters.search, mode: 'insensitive' } },
        { user: { username: { contains: filters.search, mode: 'insensitive' } } },
        { user: { email: { contains: filters.search, mode: 'insensitive' } } }
      ];
    }

    // Get pushers from database with pagination
    const [pushers, total] = await Promise.all([
      db.pusher.findMany({
        where,
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
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      db.pusher.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    // Calculate stats
    const [allPushersStats, availablePushers, hiredPushers, totalContracts] = await Promise.all([
      db.pusher.count(),
      db.pusher.count({ where: { status: 'AVAILABLE' } }),
      db.pusher.count({ where: { status: 'HIRED' } }),
      db.contract.count()
    ]);

    const averagePriceResult = await db.pusher.aggregate({
      _avg: { price: true }
    });

    const stats = {
      totalPushers: allPushersStats,
      availablePushers,
      hiredPushers,
      averagePrice: Math.round(averagePriceResult._avg.price || 0),
      totalContracts
    };

    return NextResponse.json({
      message: 'Pushers retrieved successfully',
      pushers,
      total,
      page,
      limit,
      totalPages,
      stats
    });
  } catch (error) {
    console.error('Error fetching pushers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pushers' },
      { status: 500 }
    );
  }
}