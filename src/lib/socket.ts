import { Server } from 'socket.io';

let ioInstance: Server | null = null;

export const setupSocket = (io: Server) => {
  ioInstance = io;
  
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Handle joining tournament rooms
    socket.on('join-tournament', (tournamentId: string) => {
      socket.join(`tournament-${tournamentId}`);
      console.log(`Client ${socket.id} joined tournament ${tournamentId}`);
    });

    // Handle leaving tournament rooms
    socket.on('leave-tournament', (tournamentId: string) => {
      socket.leave(`tournament-${tournamentId}`);
      console.log(`Client ${socket.id} left tournament ${tournamentId}`);
    });

    // Handle messages
    socket.on('message', (msg: { text: string; senderId: string }) => {
      // Echo: broadcast message only the client who send the message
      socket.emit('message', {
        text: `Echo: ${msg.text}`,
        senderId: 'system',
        timestamp: new Date().toISOString(),
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    // Send welcome message
    socket.emit('message', {
      text: 'Welcome to WebSocket Server!',
      senderId: 'system',
      timestamp: new Date().toISOString(),
    });
  });
};

// Function to emit match update event to specific tournament
export const emitMatchUpdate = (tournamentId: string, matchId: string) => {
  if (ioInstance) {
    ioInstance.to(`tournament-${tournamentId}`).emit('match-updated', {
      tournamentId,
      matchId,
      timestamp: new Date().toISOString(),
    });
    console.log(`Emitted match-updated event for tournament ${tournamentId}, match ${matchId}`);
  }
};

// Function to emit bracket update event to specific tournament
export const emitBracketUpdate = (tournamentId: string) => {
  if (ioInstance) {
    ioInstance.to(`tournament-${tournamentId}`).emit('bracket-updated', {
      tournamentId,
      timestamp: new Date().toISOString(),
    });
    console.log(`Emitted bracket-updated event for tournament ${tournamentId}`);
  }
};

export const getIO = (): Server | null => {
  return ioInstance;
};