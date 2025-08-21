import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PusherStatus, Availability } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const availability = searchParams.get('availability');
    const priceRange = searchParams.get('priceRange');
    const sortBy = searchParams.get('sortBy') || 'trophies';

    const skip = (page - 1) * limit;

    const where: any = {
      isActive: true,
      status: PusherStatus.AVAILABLE,
      trophies: {
        gte: 5000,
      },
    };

    if (availability && Object.values(Availability).includes(availability as Availability)) {
      where.availability = availability;
    }

    if (priceRange && priceRange !== 'all') {
      if (priceRange === '0-50') {
        where.price = {
          gte: 0,
          lte: 50,
        };
      } else if (priceRange === '50-100') {
        where.price = {
          gte: 50,
          lte: 100,
        };
      } else if (priceRange === '100+') {
        where.price = {
          gte: 100,
        };
      }
    }

    let orderBy: any = {};
    switch (sortBy) {
      case 'trophies':
        orderBy = { trophies: 'desc' };
        break;
      case 'price':
        orderBy = { price: 'asc' };
        break;
      case 'rating':
        orderBy = { createdAt: 'desc' };
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      default:
        orderBy = { trophies: 'desc' };
    }

    const [pushers, total] = await Promise.all([
      db.pusher.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          _count: {
            select: {
              contracts: {
                where: {
                  status: 'ACCEPTED',
                },
              },
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      db.pusher.count({ where }),
    ]);

    return NextResponse.json({
      pushers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Pushers fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pushers' },
      { status: 500 }
    );
  }
}