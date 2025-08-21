import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const gateway = await db.paymentGateway.findUnique({
      where: { id }
    });

    if (!gateway) {
      return NextResponse.json({ error: 'Gateway not found' }, { status: 404 });
    }

    return NextResponse.json({ gateway });
  } catch (error) {
    console.error('Error fetching payment gateway:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { displayName, description, config } = body;

    // Validate JSON config
    let parsedConfig;
    try {
      parsedConfig = JSON.parse(config || '{}');
    } catch {
      return NextResponse.json({ error: 'Invalid JSON configuration' }, { status: 400 });
    }

    const existingGateway = await db.paymentGateway.findUnique({
      where: { id }
    });

    if (!existingGateway) {
      return NextResponse.json({ error: 'Gateway not found' }, { status: 404 });
    }

    const gateway = await db.paymentGateway.update({
      where: { id },
      data: {
        displayName,
        description,
        config: JSON.stringify(parsedConfig)
      }
    });

    // Log the action
    await db.adminLog.create({
      data: {
        action: 'UPDATE_PAYMENT_GATEWAY',
        details: `Updated payment gateway: ${gateway.displayName}`,
        userId: session.user.id
      }
    });

    return NextResponse.json({ gateway });
  } catch (error) {
    console.error('Error updating payment gateway:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { isActive } = body;

    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'isActive must be a boolean' }, { status: 400 });
    }

    const existingGateway = await db.paymentGateway.findUnique({
      where: { id }
    });

    if (!existingGateway) {
      return NextResponse.json({ error: 'Gateway not found' }, { status: 404 });
    }

    const gateway = await db.paymentGateway.update({
      where: { id },
      data: { isActive }
    });

    // Log the action
    await db.adminLog.create({
      data: {
        action: isActive ? 'ENABLE_PAYMENT_GATEWAY' : 'DISABLE_PAYMENT_GATEWAY',
        details: `${isActive ? 'Enabled' : 'Disabled'} payment gateway: ${gateway.displayName}`,
        userId: session.user.id
      }
    });

    return NextResponse.json({ gateway });
  } catch (error) {
    console.error('Error patching payment gateway:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const existingGateway = await db.paymentGateway.findUnique({
      where: { id }
    });

    if (!existingGateway) {
      return NextResponse.json({ error: 'Gateway not found' }, { status: 404 });
    }

    await db.paymentGateway.delete({
      where: { id }
    });

    // Log the action
    await db.adminLog.create({
      data: {
        action: 'DELETE_PAYMENT_GATEWAY',
        details: `Deleted payment gateway: ${existingGateway.displayName}`,
        userId: session.user.id
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting payment gateway:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}