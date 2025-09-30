import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { notifications } from '@/lib/notifications/send-notification';

export async function POST(request: NextRequest) {
  try {
    console.log('=== NEGOTIATION REQUEST START ===');
    
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

    const body = await request.json();
    const { pusherId, message, proposedPrice } = body;

    console.log('Negotiation request:', { pusherId, message, proposedPrice, userId: decoded.userId });

    // Validate required fields
    if (!pusherId || !message || !proposedPrice) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate proposed price
    if (proposedPrice <= 0) {
      return NextResponse.json(
        { error: 'Proposed price must be greater than 0' },
        { status: 400 }
      );
    }

    // Check if pusher exists and is open to negotiation
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
      },
    });

    if (!pusher) {
      console.log('Pusher not found:', pusherId);
      return NextResponse.json(
        { error: 'Pusher not found' },
        { status: 404 }
      );
    }

    if (!pusher.negotiation) {
      console.log('Pusher not open to negotiation:', pusherId);
      return NextResponse.json(
        { error: 'This pusher is not open to negotiation' },
        { status: 400 }
      );
    }

    if (pusher.status !== 'AVAILABLE') {
      console.log('Pusher not available:', pusher.status);
      return NextResponse.json(
        { error: 'Pusher is not available for negotiation' },
        { status: 400 }
      );
    }

    // Check if user already has a pending negotiation with this pusher
    const existingNegotiation = await db.message.findFirst({
      where: {
        senderId: decoded.userId,
        receiverId: pusher.userId,
        pusherId: pusherId,
        content: {
          contains: 'NEGOTIATION_REQUEST:',
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (existingNegotiation) {
      const timeDiff = Date.now() - new Date(existingNegotiation.createdAt).getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      if (hoursDiff < 24) {
        return NextResponse.json(
          { error: 'You already have a pending negotiation with this pusher. Please wait 24 hours before sending another request.' },
          { status: 400 }
        );
      }
    }

    console.log('All validations passed, creating negotiation message...');

    // Create negotiation message
    const negotiationMessage = await db.message.create({
      data: {
        senderId: decoded.userId,
        receiverId: pusher.userId,
        pusherId: pusherId,
        content: `NEGOTIATION_REQUEST:${proposedPrice}:${message.trim()}`,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    console.log('Created negotiation message:', negotiationMessage.id);

    // Send notification to pusher about negotiation request
    try {
      await notifications.newMessage(
        pusher.userId,
        decoded.userId.toString()
      );
      console.log('Sent notification to pusher');
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError);
      // Continue even if notification fails
    }

    console.log('=== NEGOTIATION REQUEST SUCCESS ===');
    return NextResponse.json({
      message: 'Negotiation request sent successfully',
      negotiation: {
        id: negotiationMessage.id,
        proposedPrice,
        message: message.trim(),
        pusher: {
          id: pusher.id,
          realName: pusher.realName,
        },
        createdAt: negotiationMessage.createdAt,
      },
    });
  } catch (error) {
    console.error('=== NEGOTIATION REQUEST ERROR ===', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send negotiation request' },
      { status: 500 }
    );
  }
}