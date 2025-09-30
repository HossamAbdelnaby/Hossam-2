import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { ContractStatus, PusherStatus } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const {
      pusherId,
      message,
      clanTag,
    } = body;

    // Validate required fields
    if (!pusherId || !message || !clanTag) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if pusher exists and is available
    const pusher = await db.pusher.findUnique({
      where: { id: pusherId },
    });

    if (!pusher) {
      return NextResponse.json(
        { error: 'Pusher not found' },
        { status: 404 }
      );
    }

    if (pusher.status !== PusherStatus.AVAILABLE) {
      return NextResponse.json(
        { error: 'Pusher is not available for hire' },
        { status: 400 }
      );
    }

    // Check if user already has a pending contract with this pusher
    const existingContract = await db.contract.findFirst({
      where: {
        pusherId,
        clientId: decoded.userId,
        status: ContractStatus.PENDING,
      },
    });

    if (existingContract) {
      return NextResponse.json(
        { error: 'You already have a pending contract with this pusher' },
        { status: 400 }
      );
    }

    // Create contract
    const contract = await db.contract.create({
      data: {
        pusherId,
        clientId: decoded.userId,
        message: message.trim(),
        clanTag: clanTag.trim(),
        status: ContractStatus.PENDING,
      },
      include: {
        pusher: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
        client: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Contract request sent successfully',
      contract,
    });
  } catch (error) {
    console.error('Contract creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create contract' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const contracts = await db.contract.findMany({
      where: {
        clientId: decoded.userId,
      },
      include: {
        pusher: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ contracts });
  } catch (error) {
    console.error('Contracts fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contracts' },
      { status: 500 }
    );
  }
}