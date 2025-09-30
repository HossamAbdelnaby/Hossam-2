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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request);

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { status, isActive } = await request.json();
    const pusherId = params.id;

    // Check if pusher exists
    const existingPusher = await db.pusher.findUnique({
      where: { id: pusherId }
    });

    if (!existingPusher) {
      return NextResponse.json({ error: 'Pusher not found' }, { status: 404 });
    }

    // Update the pusher in database
    const updatedPusher = await db.pusher.update({
      where: { id: pusherId },
      data: {
        ...(status && { status }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date()
      }
    });

    console.log(`Pusher ${pusherId} updated by ${user.email}:`, { status, isActive });

    return NextResponse.json({
      message: 'Pusher updated successfully',
      pusherId,
      status: updatedPusher.status,
      isActive: updatedPusher.isActive
    });
  } catch (error) {
    console.error('Error updating pusher:', error);
    return NextResponse.json(
      { error: 'Failed to update pusher' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request);

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const pusherId = params.id;

    // Check if pusher exists
    const existingPusher = await db.pusher.findUnique({
      where: { id: pusherId }
    });

    if (!existingPusher) {
      return NextResponse.json({ error: 'Pusher not found' }, { status: 404 });
    }

    // Delete the pusher from database
    await db.pusher.delete({
      where: { id: pusherId }
    });

    return NextResponse.json({
      message: 'Pusher deleted successfully',
      pusherId
    });
  } catch (error) {
    console.error('Error deleting pusher:', error);
    return NextResponse.json(
      { error: 'Failed to delete pusher' },
      { status: 500 }
    );
  }
}