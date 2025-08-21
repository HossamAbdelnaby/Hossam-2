import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { TournamentScheduler } from '@/lib/scheduler';
import { updateAllTournamentStatuses } from '@/lib/tournament-status';

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

    // Check if user has admin privileges
    if (decoded.role !== 'ADMIN' && decoded.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const scheduler = TournamentScheduler.getInstance();
    const status = await scheduler.getSchedulerStatus();

    return NextResponse.json({
      message: 'Scheduler status retrieved successfully',
      scheduler: status,
    });
  } catch (error) {
    console.error('Error getting scheduler status:', error);
    return NextResponse.json(
      { error: 'Failed to get scheduler status' },
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
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user has admin privileges
    if (decoded.role !== 'ADMIN' && decoded.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'force_check') {
      const scheduler = TournamentScheduler.getInstance();
      const updates = await scheduler.forceCheck();

      return NextResponse.json({
        message: 'Force check completed successfully',
        updates,
        count: updates.length,
      });
    }

    if (action === 'update_all') {
      const updates = await updateAllTournamentStatuses();

      return NextResponse.json({
        message: 'All tournament statuses updated successfully',
        updates,
        count: updates.length,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "force_check" or "update_all"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in scheduler action:', error);
    return NextResponse.json(
      { error: 'Failed to perform scheduler action' },
      { status: 500 }
    );
  }
}