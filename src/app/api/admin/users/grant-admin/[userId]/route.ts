import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user role to admin
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        role: 'ADMIN',
      },
    });

    return NextResponse.json({
      message: 'User granted admin privileges successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error('Error granting admin privileges:', error);
    return NextResponse.json(
      { error: 'Failed to grant admin privileges' },
      { status: 500 }
    );
  }
}