import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pusherId } = await params;

    const pusher = await db.pusher.findUnique({
      where: { id: pusherId },
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
    });

    if (!pusher) {
      return NextResponse.json(
        { error: 'Pusher not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ pusher });
  } catch (error) {
    console.error('Pusher fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pusher' },
      { status: 500 }
    );
  }
}