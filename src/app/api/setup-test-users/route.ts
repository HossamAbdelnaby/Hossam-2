import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Create test admin user
    const adminUser = await db.user.create({
      data: {
        email: 'admin@example.com',
        username: 'admin',
        password: hashedPassword,
        name: 'Admin User',
        role: 'SUPER_ADMIN',
        language: 'en'
      }
    });

    // Create test regular user
    const regularUser = await db.user.create({
      data: {
        email: 'user@example.com',
        username: 'user',
        password: hashedPassword,
        name: 'Regular User',
        role: 'USER',
        language: 'en'
      }
    });

    // Create a test tournament
    const tournament = await db.tournament.create({
      data: {
        name: 'Test Tournament',
        description: 'A test tournament for development',
        host: 'Test Host',
        prizeAmount: 1000,
        maxTeams: 16,
        registrationStart: new Date(),
        tournamentStart: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        bracketType: 'SINGLE_ELIMINATION',
        packageType: 'FREE',
        organizerId: adminUser.id,
        status: 'REGISTRATION_OPEN',
        isActive: true,
      }
    });

    // Create tournament stage
    await db.tournamentStage.create({
      data: {
        name: 'Single Elimination Stage',
        type: 'SINGLE_ELIMINATION',
        order: 0,
        tournamentId: tournament.id,
      },
    });

    return NextResponse.json({
      message: 'Test data created successfully',
      users: [
        { id: adminUser.id, email: adminUser.email, role: adminUser.role },
        { id: regularUser.id, email: regularUser.email, role: regularUser.role }
      ],
      tournament: {
        id: tournament.id,
        name: tournament.name,
        status: tournament.status
      }
    });
  } catch (error) {
    console.error('Setup test data error:', error);
    return NextResponse.json(
      { error: 'Failed to setup test data' },
      { status: 500 }
    );
  }
}