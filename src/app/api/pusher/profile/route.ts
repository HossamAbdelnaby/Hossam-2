import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { Availability, PusherStatus } from '@prisma/client';

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

    const pusher = await db.pusher.findUnique({
      where: { userId: decoded.userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        contracts: {
          include: {
            client: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
            payment: true, // Include payment relationship
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!pusher) {
      return NextResponse.json(
        { error: 'Pusher profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ pusher });
  } catch (error) {
    console.error('Pusher profile fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pusher profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
      status,
    } = body;

    // Validate required fields
    if (trophies !== undefined && trophies < 5000) {
      return NextResponse.json(
        { error: 'Minimum 5000 trophies required' },
        { status: 400 }
      );
    }

    if (realName !== undefined && !realName.trim()) {
      return NextResponse.json(
        { error: 'Real name is required' },
        { status: 400 }
      );
    }

    if (price !== undefined && price <= 0) {
      return NextResponse.json(
        { error: 'Valid price is required' },
        { status: 400 }
      );
    }

    if (paymentMethod !== undefined && !paymentMethod) {
      return NextResponse.json(
        { error: 'Payment method is required' },
        { status: 400 }
      );
    }

    if (availability !== undefined && !Object.values(Availability).includes(availability)) {
      return NextResponse.json(
        { error: 'Invalid availability type' },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (status !== undefined && !Object.values(PusherStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Check if pusher profile exists
    const existingProfile = await db.pusher.findUnique({
      where: { userId: decoded.userId },
    });

    if (!existingProfile) {
      return NextResponse.json(
        { error: 'Pusher profile not found' },
        { status: 404 }
      );
    }

    // Update pusher profile
    const updateData: any = {};
    
    if (trophies !== undefined) updateData.trophies = trophies;
    if (realName !== undefined) updateData.realName = realName.trim();
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture?.trim() || null;
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (tagPlayer !== undefined) updateData.tagPlayer = tagPlayer?.trim() || null;
    if (price !== undefined) updateData.price = price;
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
    if (negotiation !== undefined) updateData.negotiation = negotiation || false;
    if (availability !== undefined) updateData.availability = availability;
    if (status !== undefined) updateData.status = status;

    const pusher = await db.pusher.update({
      where: { userId: decoded.userId },
      data: updateData,
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
      message: 'Pusher profile updated successfully',
      pusher,
    });
  } catch (error) {
    console.error('Pusher profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update pusher profile' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if pusher profile exists
    const existingProfile = await db.pusher.findUnique({
      where: { userId: decoded.userId },
    });

    if (!existingProfile) {
      return NextResponse.json(
        { error: 'Pusher profile not found' },
        { status: 404 }
      );
    }

    // Delete pusher profile
    await db.pusher.delete({
      where: { userId: decoded.userId },
    });

    return NextResponse.json({
      message: 'Pusher profile deleted successfully',
    });
  } catch (error) {
    console.error('Pusher profile deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete pusher profile' },
      { status: 500 }
    );
  }
}