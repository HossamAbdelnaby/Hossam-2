import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { ContractStatus } from '@prisma/client';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id: contractId } = await params;
    const body = await request.json();
    const { action } = body;

    if (!action || !['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Valid action (accept/reject) is required' },
        { status: 400 }
      );
    }

    // Check if contract exists and belongs to the user's pusher profile
    const contract = await db.contract.findUnique({
      where: { id: contractId },
      include: {
        pusher: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    if (contract.pusher.userId !== decoded.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (contract.status !== ContractStatus.PENDING) {
      return NextResponse.json(
        { error: 'Contract is no longer pending' },
        { status: 400 }
      );
    }

    // Update contract status
    const updatedContract = await db.contract.update({
      where: { id: contractId },
      data: {
        status: action === 'accept' ? ContractStatus.ACCEPTED : ContractStatus.REJECTED,
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

    // If accepted, update pusher status to HIRED
    if (action === 'accept') {
      await db.pusher.update({
        where: { id: contract.pusherId },
        data: {
          status: 'HIRED',
        },
      });
    }

    return NextResponse.json({
      message: `Contract ${action}ed successfully`,
      contract: updatedContract,
    });
  } catch (error) {
    console.error('Contract action error:', error);
    return NextResponse.json(
      { error: 'Failed to process contract action' },
      { status: 500 }
    );
  }
}