import { db } from '@/lib/db';

export interface TournamentStatusUpdate {
  id: string;
  oldStatus: string;
  newStatus: string;
  reason: string;
}

/**
 * Calculate the correct tournament status based on dates
 */
export function calculateTournamentStatus(
  registrationStart: Date,
  registrationEnd: Date | null,
  tournamentStart: Date,
  tournamentEnd: Date | null,
  currentStatus: string
): string {
  const now = new Date();
  
  // If tournament is completed, it stays completed regardless of dates
  if (currentStatus === 'COMPLETED') {
    return 'COMPLETED';
  }
  
  // Check if tournament should be in progress
  if (now >= tournamentStart) {
    if (tournamentEnd && now > tournamentEnd) {
      return 'COMPLETED';
    }
    return 'IN_PROGRESS';
  }
  
  // Check if registration should be closed
  if (registrationEnd && now > registrationEnd) {
    return 'REGISTRATION_CLOSED';
  }
  
  // Check if registration should be open
  if (now >= registrationStart) {
    return 'REGISTRATION_OPEN';
  }
  
  // If none of the above, it's still in draft
  return 'DRAFT';
}

/**
 * Update status for a single tournament
 */
export async function updateTournamentStatus(tournamentId: string): Promise<TournamentStatusUpdate | null> {
  try {
    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        id: true,
        status: true,
        registrationStart: true,
        registrationEnd: true,
        tournamentStart: true,
        tournamentEnd: true,
      },
    });

    if (!tournament) {
      throw new Error(`Tournament with ID ${tournamentId} not found`);
    }

    const oldStatus = tournament.status;
    const newStatus = calculateTournamentStatus(
      new Date(tournament.registrationStart),
      tournament.registrationEnd ? new Date(tournament.registrationEnd) : null,
      new Date(tournament.tournamentStart),
      tournament.tournamentEnd ? new Date(tournament.tournamentEnd) : null,
      oldStatus
    );

    // Only update if status has changed
    if (oldStatus !== newStatus) {
      const updatedTournament = await db.tournament.update({
        where: { id: tournamentId },
        data: { status: newStatus },
        select: { status: true },
      });

      return {
        id: tournamentId,
        oldStatus,
        newStatus: updatedTournament.status,
        reason: getStatusChangeReason(oldStatus, newStatus),
      };
    }

    return null;
  } catch (error) {
    console.error(`Error updating tournament status for ${tournamentId}:`, error);
    throw error;
  }
}

/**
 * Update status for all tournaments
 */
export async function updateAllTournamentStatuses(): Promise<TournamentStatusUpdate[]> {
  try {
    // Check if db is properly initialized
    if (!db || !db.tournament) {
      throw new Error('Database connection not established');
    }

    const tournaments = await db.tournament.findMany({
      where: { isActive: true },
      select: {
        id: true,
        status: true,
        registrationStart: true,
        registrationEnd: true,
        tournamentStart: true,
        tournamentEnd: true,
      },
    });

    const updates: TournamentStatusUpdate[] = [];

    for (const tournament of tournaments) {
      const oldStatus = tournament.status;
      const newStatus = calculateTournamentStatus(
        new Date(tournament.registrationStart),
        tournament.registrationEnd ? new Date(tournament.registrationEnd) : null,
        new Date(tournament.tournamentStart),
        tournament.tournamentEnd ? new Date(tournament.tournamentEnd) : null,
        oldStatus
      );

      if (oldStatus !== newStatus) {
        try {
          const updatedTournament = await db.tournament.update({
            where: { id: tournament.id },
            data: { status: newStatus },
            select: { status: true },
          });

          updates.push({
            id: tournament.id,
            oldStatus,
            newStatus: updatedTournament.status,
            reason: getStatusChangeReason(oldStatus, newStatus),
          });

          console.log(`Tournament ${tournament.id} status updated: ${oldStatus} -> ${newStatus}`);
        } catch (error) {
          console.error(`Error updating tournament ${tournament.id}:`, error);
        }
      }
    }

    return updates;
  } catch (error) {
    console.error('Error updating tournament statuses:', error);
    throw error;
  }
}

/**
 * Get a human-readable reason for status change
 */
function getStatusChangeReason(oldStatus: string, newStatus: string): string {
  const now = new Date();
  
  switch (newStatus) {
    case 'REGISTRATION_OPEN':
      return 'Registration period has started';
    case 'REGISTRATION_CLOSED':
      return 'Registration period has ended';
    case 'IN_PROGRESS':
      return 'Tournament has started';
    case 'COMPLETED':
      return 'Tournament has ended';
    case 'DRAFT':
      return 'Tournament is in draft phase';
    default:
      return 'Status updated based on tournament dates';
  }
}

/**
 * Check if a tournament needs status update based on date changes
 */
export function needsStatusUpdate(
  oldDates: {
    registrationStart: Date;
    registrationEnd: Date | null;
    tournamentStart: Date;
    tournamentEnd: Date | null;
  },
  newDates: {
    registrationStart: Date;
    registrationEnd: Date | null;
    tournamentStart: Date;
    tournamentEnd: Date | null;
  },
  currentStatus: string
): boolean {
  const oldStatus = calculateTournamentStatus(
    oldDates.registrationStart,
    oldDates.registrationEnd,
    oldDates.tournamentStart,
    oldDates.tournamentEnd,
    currentStatus
  );

  const newStatus = calculateTournamentStatus(
    newDates.registrationStart,
    newDates.registrationEnd,
    newDates.tournamentStart,
    newDates.tournamentEnd,
    currentStatus
  );

  return oldStatus !== newStatus;
}