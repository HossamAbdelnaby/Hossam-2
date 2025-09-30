import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { ContractStatus, PaymentStatus, PaymentMethod, PaymentType, PusherStatus } from '@prisma/client';
import { notifications } from '@/lib/notifications/send-notification';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('=== CONTRACT UPDATE START ===');
    
    const token = request.cookies.get('auth-token')?.value;
    console.log('Token found:', !!token);

    if (!token) {
      console.log('No authentication token found');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      console.log('Invalid token');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log('User authenticated:', decoded.userId);

    const { id: contractId } = await params;
    const body = await request.json();
    const { action } = body;

    console.log('Contract action request:', { contractId, action, userId: decoded.userId });

    if (!action || !['accept', 'reject'].includes(action)) {
      console.log('Invalid action:', action);
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
            status: true,
          },
        },
      },
    });

    console.log('Found contract:', contract);

    if (!contract) {
      console.log('Contract not found:', contractId);
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    if (contract.pusher.userId !== decoded.userId) {
      console.log('Unauthorized access attempt:', { contractPusherUserId: contract.pusher.userId, requestUserId: decoded.userId });
      return NextResponse.json(
        { error: 'Unauthorized - This contract does not belong to your pusher profile' },
        { status: 403 }
      );
    }

    if (contract.status !== ContractStatus.PENDING) {
      console.log('Contract not pending:', contract.status);
      return NextResponse.json(
        { error: `Contract is no longer pending. Current status: ${contract.status}` },
        { status: 400 }
      );
    }

    console.log('All validations passed, updating contract...');

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
        payment: true, // Include payment relationship
      },
    });

    console.log('Updated contract:', updatedContract);

    // Create notification for the client
    try {
      if (action === 'accept') {
        await notifications.contractAccepted(
          updatedContract.clientId, 
          updatedContract.pusher.realName
        );
      } else {
        await notifications.contractRejected(
          updatedContract.clientId, 
          updatedContract.pusher.realName
        );
      }
      console.log('Created notification for client');
    } catch (notificationError) {
      console.error('Error creating client notification:', notificationError);
      // Continue with contract update even if notification fails
    }

    let payment = null;
    // If accepted, update pusher status to HIRED and create payment
    if (action === 'accept') {
      try {
        console.log('Updating pusher status...');
        await db.pusher.update({
          where: { id: contract.pusherId },
          data: {
            status: PusherStatus.HIRED,
          },
        });
        console.log('Updated pusher status to HIRED');

        console.log('Creating payment record...');
        // Create payment record for the contract
        payment = await db.payment.create({
          data: {
            amount: updatedContract.pusher.price,
            method: PaymentMethod.CREDIT_CARD, // Default method, can be changed by client
            status: PaymentStatus.PENDING,
            type: PaymentType.PLAYER_RENTAL,
            currency: 'USD',
            description: `Payment for contract with ${updatedContract.pusher.realName}`,
            userId: updatedContract.clientId,
            contractId: updatedContract.id,
          },
        });

        console.log('Created payment record:', payment);

        // Create notification for pusher about payment creation
        await notifications.contractPaymentCreated(
          updatedContract.pusher.userId,
          updatedContract.client.name || updatedContract.client.email,
          updatedContract.pusher.price
        );

        console.log('Created notification for pusher about payment');
      } catch (paymentError) {
        console.error('Error creating payment or notification:', paymentError);
        // Continue with contract update even if payment creation fails
        // The contract is still accepted, but payment might need manual intervention
      }
    }

    console.log('=== CONTRACT UPDATE SUCCESS ===');
    return NextResponse.json({
      message: `Contract ${action}ed successfully`,
      contract: updatedContract,
      payment: payment,
    });
  } catch (error) {
    console.error('=== CONTRACT UPDATE ERROR ===', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process contract action' },
      { status: 500 }
    );
  }
}