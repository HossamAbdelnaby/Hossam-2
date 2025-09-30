import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { ContractStatus, PusherStatus, PaymentMethod, PaymentStatus, PaymentType } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    console.log('=== TEST CONTRACT ENDPOINT CALLED ===');
    
    const token = request.cookies.get('auth-token')?.value;
    console.log('Token found:', !!token);

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log('User authenticated:', decoded.userId);

    // Check if user has a pusher profile
    const pusher = await db.pusher.findUnique({
      where: { userId: decoded.userId },
    });

    if (!pusher) {
      return NextResponse.json({ 
        error: 'No pusher profile found',
        hasPusherProfile: false 
      }, { status: 404 });
    }

    console.log('Pusher profile found:', pusher.id);

    // Check for any pending contracts
    const pendingContracts = await db.contract.findMany({
      where: {
        pusherId: pusher.id,
        status: ContractStatus.PENDING,
      },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    console.log('Pending contracts found:', pendingContracts.length);

    return NextResponse.json({
      message: 'Test endpoint working',
      hasPusherProfile: true,
      pusherId: pusher.id,
      pusherStatus: pusher.status,
      pendingContracts: pendingContracts,
      pendingContractsCount: pendingContracts.length,
    });

  } catch (error) {
    console.error('=== TEST CONTRACT ENDPOINT ERROR ===', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Test endpoint failed' },
      { status: 500 }
    );
  }
}