import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const gateways = await db.paymentGateway.findMany({
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json({ gateways });
  } catch (error) {
    console.error('Error fetching payment gateways:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, displayName, description, config } = body;

    if (!name || !displayName) {
      return NextResponse.json({ error: 'Name and display name are required' }, { status: 400 });
    }

    // Validate JSON config
    let parsedConfig;
    try {
      parsedConfig = JSON.parse(config || '{}');
    } catch {
      return NextResponse.json({ error: 'Invalid JSON configuration' }, { status: 400 });
    }

    // Check if gateway name already exists
    const existingGateway = await db.paymentGateway.findUnique({
      where: { name }
    });

    if (existingGateway) {
      return NextResponse.json({ error: 'Gateway name already exists' }, { status: 400 });
    }

    const gateway = await db.paymentGateway.create({
      data: {
        name,
        displayName,
        description,
        config: JSON.stringify(parsedConfig),
        isActive: false // Default to inactive for security
      }
    });

    // Log the action
    await db.adminLog.create({
      data: {
        action: 'CREATE_PAYMENT_GATEWAY',
        details: `Created payment gateway: ${displayName} (${name})`,
        userId: session.user.id
      }
    });

    return NextResponse.json({ gateway });
  } catch (error) {
    console.error('Error creating payment gateway:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}