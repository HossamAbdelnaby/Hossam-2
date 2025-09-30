import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { Availability, PusherStatus } from '@prisma/client';

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
      trophies,
      realName,
      profilePicture,
      description,
      tagPlayer,
      price,
      paymentMethod,
      negotiation,
      availability,
    } = body;

    // Validate required fields
    if (!trophies || trophies < 5000) {
      return NextResponse.json(
        { error: 'Minimum 5000 trophies required' },
        { status: 400 }
      );
    }

    if (!realName || !realName.trim()) {
      return NextResponse.json(
        { error: 'Real name is required' },
        { status: 400 }
      );
    }

    if (!price || price <= 0) {
      return NextResponse.json(
        { error: 'Valid price is required' },
        { status: 400 }
      );
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'Payment method is required' },
        { status: 400 }
      );
    }

    if (!Object.values(Availability).includes(availability)) {
      return NextResponse.json(
        { error: 'Invalid availability type' },
        { status: 400 }
      );
    }

    // Check if user already has a pusher profile
    const existingProfile = await db.pusher.findUnique({
      where: { userId: decoded.userId },
    });

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Pusher profile already exists. Use PUT to update.' },
        { status: 400 }
      );
    }

    // Create pusher profile
    const pusher = await db.pusher.create({
      data: {
        trophies,
        realName: realName.trim(),
        profilePicture: profilePicture?.trim() || null,
        description: description?.trim() || null,
        tagPlayer: tagPlayer?.trim() || null,
        price,
        paymentMethod,
        negotiation: negotiation || false,
        availability,
        status: PusherStatus.AVAILABLE,
        userId: decoded.userId,
      },
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

    return NextResponse.json({
      message: 'Pusher profile created successfully',
      pusher,
    });
  } catch (error) {
    console.error('Pusher registration error:', error);
    return NextResponse.json(
      { error: 'Failed to create pusher profile' },
      { status: 500 }
    );
  }
}