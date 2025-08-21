import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id: packageId } = await params;

    const pkg = await db.packagePrice.findUnique({
      where: { id: packageId }
    });

    if (!pkg) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ package: pkg });
  } catch (error) {
    console.error('Error fetching package:', error);
    return NextResponse.json(
      { error: 'Failed to fetch package' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id: packageId } = await params;
    const body = await request.json();
    const { price, currency } = body;

    if (typeof price !== 'number' || price < 0) {
      return NextResponse.json(
        { error: 'Invalid price' },
        { status: 400 }
      );
    }

    const updatedPackage = await db.packagePrice.update({
      where: { id: packageId },
      data: {
        price,
        currency: currency || 'USD',
        updatedBy: decoded.userId
      }
    });

    // Log admin action
    await db.adminLog.create({
      data: {
        action: 'UPDATE_PACKAGE_PRICE',
        targetId: packageId,
        targetType: 'PackagePrice',
        details: JSON.stringify({ price, currency }),
        userId: decoded.userId,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      message: 'Package updated successfully',
      package: updatedPackage
    });
  } catch (error) {
    console.error('Error updating package:', error);
    return NextResponse.json(
      { error: 'Failed to update package' },
      { status: 500 }
    );
  }
}

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
    if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id: packageId } = await params;
    const body = await request.json();
    const { isActive } = body;

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid isActive value' },
        { status: 400 }
      );
    }

    const updatedPackage = await db.packagePrice.update({
      where: { id: packageId },
      data: {
        isActive,
        updatedBy: decoded.userId
      }
    });

    // Log admin action
    await db.adminLog.create({
      data: {
        action: 'TOGGLE_PACKAGE_STATUS',
        targetId: packageId,
        targetType: 'PackagePrice',
        details: JSON.stringify({ isActive }),
        userId: decoded.userId,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      message: `Package ${isActive ? 'activated' : 'deactivated'} successfully`,
      package: updatedPackage
    });
  } catch (error) {
    console.error('Error updating package status:', error);
    return NextResponse.json(
      { error: 'Failed to update package status' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id: packageId } = await params;

    await db.packagePrice.delete({
      where: { id: packageId }
    });

    // Log admin action
    await db.adminLog.create({
      data: {
        action: 'DELETE_PACKAGE_PRICE',
        targetId: packageId,
        targetType: 'PackagePrice',
        userId: decoded.userId,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      message: 'Package deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting package:', error);
    return NextResponse.json(
      { error: 'Failed to delete package' },
      { status: 500 }
    );
  }
}