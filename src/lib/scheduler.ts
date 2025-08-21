import { updateAllTournamentStatuses, TournamentStatusUpdate } from '@/lib/tournament-status';

export class TournamentScheduler {
  private static instance: TournamentScheduler;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  private constructor() {}

  public static getInstance(): TournamentScheduler {
    if (!TournamentScheduler.instance) {
      TournamentScheduler.instance = new TournamentScheduler();
    }
    return TournamentScheduler.instance;
  }

  public start(): void {
    if (this.isRunning) {
      console.log('Tournament scheduler is already running');
      return;
    }

    console.log('Starting tournament scheduler...');
    this.isRunning = true;
    
    // Delay the first check to allow database to fully initialize
    setTimeout(() => {
      this.checkTournamentStatuses();
    }, 5000); // 5 second delay
    
    // Run every minute (60000 ms)
    this.intervalId = setInterval(() => {
      this.checkTournamentStatuses();
    }, 60000);
  }

  public stop(): void {
    if (!this.isRunning) {
      console.log('Tournament scheduler is not running');
      return;
    }

    console.log('Stopping tournament scheduler...');
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async checkTournamentStatuses(): Promise<void> {
    try {
      console.log('Checking tournament statuses for automatic updates...');
      
      const updates = await updateAllTournamentStatuses();

      if (updates.length > 0) {
        console.log(`Automatically updated ${updates.length} tournament statuses:`);
        updates.forEach(update => {
          console.log(`  - ${update.id}: ${update.oldStatus} → ${update.newStatus} (${update.reason})`);
        });
      } else {
        console.log('No tournament status updates needed');
      }

    } catch (error) {
      console.error('Error checking tournament statuses:', error);
    }
  }

  public async getSchedulerStatus(): Promise<{
    isRunning: boolean;
    lastCheck?: Date;
    nextCheck?: Date;
  }> {
    return {
      isRunning: this.isRunning,
      lastCheck: new Date(), // In a real implementation, you'd store the last check time
      nextCheck: this.isRunning ? new Date(Date.now() + 60000) : undefined,
    };
  }

  public async forceCheck(): Promise<TournamentStatusUpdate[]> {
    console.log('Forcing tournament status check...');
    
    try {
      const updates = await updateAllTournamentStatuses();
      
      console.log(`Force check completed: ${updates.length} tournaments updated`);
      return updates;

    } catch (error) {
      console.error('Error during force check:', error);
      throw error;
    }
  }
}