import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const packages = await db.packagePrice.findMany({
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json({ packages });
  } catch (error) {
    console.error('Error fetching package prices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch package prices' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { packageType, price, currency, name, description, features, color, isActive } = body;

    if (!packageType || typeof price !== 'number' || price < 0) {
      return NextResponse.json(
        { error: 'Invalid package data' },
        { status: 400 }
      );
    }

    // Check if package type already exists
    const existingPackage = await db.packagePrice.findUnique({
      where: { packageType }
    });

    if (existingPackage) {
      return NextResponse.json(
        { error: 'Package type already exists' },
        { status: 400 }
      );
    }

    const newPackage = await db.packagePrice.create({
      data: {
        packageType,
        name: name || '',
        description: description || '',
        price,
        currency: currency || 'USD',
        features: JSON.stringify(features || []),
        color: color || '#3B82F6',
        isActive: isActive !== undefined ? isActive : true,
        isEditable: packageType !== 'FREE', // FREE package is not editable
        updatedBy: decoded.userId
      }
    });

    // Log admin action
    await db.adminLog.create({
      data: {
        action: 'CREATE_PACKAGE_PRICE',
        targetId: newPackage.id,
        targetType: 'PackagePrice',
        details: JSON.stringify({ packageType, price, currency, name, description, features, color, isActive }),
        userId: decoded.userId,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      message: 'Package created successfully',
      package: newPackage
    });
  } catch (error) {
    console.error('Error creating package:', error);
    return NextResponse.json(
      { error: 'Failed to create package' },
      { status: 500 }
    );
  }
}