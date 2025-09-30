import { updateAllTournamentStatuses, TournamentStatusUpdate } from '@/lib/tournament-status';

// Global singleton instance
let globalSchedulerInstance: TournamentScheduler | null = null;

export class TournamentScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private lastCheckTime: Date | null = null;

  private constructor() {
    console.log('TournamentScheduler instance created');
  }

  public static getInstance(): TournamentScheduler {
    if (!globalSchedulerInstance) {
      console.log('Creating new TournamentScheduler instance');
      globalSchedulerInstance = new TournamentScheduler();
    }
    return globalSchedulerInstance;
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
    
    console.log('Tournament scheduler started successfully');
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
    
    console.log('Tournament scheduler stopped successfully');
  }

  private async checkTournamentStatuses(): Promise<void> {
    try {
      console.log('Checking tournament statuses for automatic updates...');
      
      const updates = await updateAllTournamentStatuses();
      this.lastCheckTime = new Date();

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
    console.log('Getting scheduler status - isRunning:', this.isRunning);
    return {
      isRunning: this.isRunning,
      lastCheck: this.lastCheckTime,
      nextCheck: this.isRunning ? new Date(Date.now() + 60000) : undefined,
    };
  }

  public async forceCheck(): Promise<TournamentStatusUpdate[]> {
    console.log('Forcing tournament status check...');
    
    try {
      const updates = await updateAllTournamentStatuses();
      this.lastCheckTime = new Date();
      
      console.log(`Force check completed: ${updates.length} tournaments updated`);
      return updates;

    } catch (error) {
      console.error('Error during force check:', error);
      throw error;
    }
  }
}