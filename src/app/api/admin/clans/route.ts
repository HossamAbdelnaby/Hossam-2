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
      leagueLevel: searchParams.get('leagueLevel') || '',
      minMembers: searchParams.get('minMembers') || '',
      maxPayment: searchParams.get('maxPayment') || '',
      isActive: searchParams.get('isActive') || 'all'
    };

    // Build where clause for filtering
    const where: any = {};
    
    if (filters.leagueLevel) {
      where.leagueLevel = parseInt(filters.leagueLevel);
    }
    
    if (filters.minMembers) {
      where.playerCount = { gte: parseInt(filters.minMembers) };
    }
    
    if (filters.maxPayment) {
      where.offeredPayment = { lte: parseInt(filters.maxPayment) };
    }
    
    if (filters.isActive !== 'all') {
      where.isActive = filters.isActive === 'true';
    }
    
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { tag: { contains: filters.search, mode: 'insensitive' } },
        { owner: { username: { contains: filters.search, mode: 'insensitive' } } }
      ];
    }

    // Get clans from database with pagination
    const [clans, total] = await Promise.all([
      db.clan.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              username: true,
              name: true,
              phone: true
            }
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  name: true
                }
              }
            }
          },
          applications: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  name: true
                }
              }
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      db.clan.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    // Calculate stats
    const [allClansStats, activeClansStats, totalMembersStats, totalApplicationsStats] = await Promise.all([
      db.clan.count(),
      db.clan.count({ where: { isActive: true } }),
      db.clanMember.count(),
      db.clanApplication.count()
    ]);

    const averagePaymentResult = await db.clan.aggregate({
      _avg: { offeredPayment: true }
    });

    const stats = {
      totalClans: allClansStats,
      activeClans: activeClansStats,
      totalMembers: totalMembersStats,
      averagePayment: Math.round(averagePaymentResult._avg.offeredPayment || 0),
      totalApplications: totalApplicationsStats
    };

    return NextResponse.json({
      message: 'Clans retrieved successfully',
      clans,
      total,
      page,
      limit,
      totalPages,
      stats
    });
  } catch (error) {
    console.error('Error fetching clans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clans' },
      { status: 500 }
    );
  }
}