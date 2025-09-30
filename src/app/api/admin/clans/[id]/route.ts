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

    const { isActive } = await request.json();
    const clanId = params.id;

    // Check if clan exists
    const existingClan = await db.clan.findUnique({
      where: { id: clanId }
    });

    if (!existingClan) {
      return NextResponse.json({ error: 'Clan not found' }, { status: 404 });
    }

    // Update the clan in database
    const updatedClan = await db.clan.update({
      where: { id: clanId },
      data: {
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date()
      }
    });

    console.log(`Clan ${clanId} updated by ${user.email}:`, { isActive });

    return NextResponse.json({
      message: 'Clan updated successfully',
      clanId,
      isActive: updatedClan.isActive
    });
  } catch (error) {
    console.error('Error updating clan:', error);
    return NextResponse.json(
      { error: 'Failed to update clan' },
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

    const clanId = params.id;

    // Check if clan exists
    const existingClan = await db.clan.findUnique({
      where: { id: clanId }
    });

    if (!existingClan) {
      return NextResponse.json({ error: 'Clan not found' }, { status: 404 });
    }

    // Delete the clan and all related data from database
    await db.clan.delete({
      where: { id: clanId }
    });

    return NextResponse.json({
      message: 'Clan deleted successfully',
      clanId
    });
  } catch (error) {
    console.error('Error deleting clan:', error);
    return NextResponse.json(
      { error: 'Failed to delete clan' },
      { status: 500 }
    );
  }
}