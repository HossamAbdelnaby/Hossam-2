import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';
import { TournamentScheduler } from '@/lib/scheduler';
import { updateAllTournamentStatuses } from '@/lib/tournament-status';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function getAuthUser(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
    
    // Get user from database to verify role
    // For now, we'll trust the token since it's verified
    return {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };
  } catch (error) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const scheduler = TournamentScheduler.getInstance();
    
    // Ensure scheduler is running
    if (!scheduler.isRunning) {
      console.log('Scheduler is not running, attempting to start it...');
      scheduler.start();
    }
    
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
    const user = await getAuthUser(request);

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    let body;
    try {
      body = await request.json();
    } catch (error) {
      // If no body, default to force_check action
      body = { action: 'force_check' };
    }

    const { action } = body;

    if (action === 'force_check' || !action) {
      try {
        const scheduler = TournamentScheduler.getInstance();
        const updates = await scheduler.forceCheck();

        return NextResponse.json({
          message: 'Force check completed successfully',
          updates: updates.map(update => ({
            id: update.id,
            name: `Tournament ${update.id}`, // We don't have the name in the update
            currentStatus: update.oldStatus,
            newStatus: update.newStatus,
            reason: update.reason
          })),
          count: updates.length,
        });
      } catch (schedulerError) {
        console.error('Scheduler force check failed:', schedulerError);
        
        // Fallback to direct status update
        try {
          const updates = await updateAllTournamentStatuses();
          
          return NextResponse.json({
            message: 'Force check completed successfully (fallback)',
            updates: updates.map(update => ({
              id: update.id,
              name: `Tournament ${update.id}`,
              currentStatus: update.oldStatus,
              newStatus: update.newStatus,
              reason: update.reason
            })),
            count: updates.length,
          });
        } catch (fallbackError) {
          console.error('Fallback status update also failed:', fallbackError);
          throw new Error('Both scheduler and fallback failed');
        }
      }
    }

    if (action === 'update_all') {
      const updates = await updateAllTournamentStatuses();

      return NextResponse.json({
        message: 'All tournament statuses updated successfully',
        updates: updates.map(update => ({
          id: update.id,
          name: `Tournament ${update.id}`,
          currentStatus: update.oldStatus,
          newStatus: update.newStatus,
          reason: update.reason
        })),
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
      { error: error instanceof Error ? error.message : 'Failed to perform scheduler action' },
      { status: 500 }
    );
  }
}