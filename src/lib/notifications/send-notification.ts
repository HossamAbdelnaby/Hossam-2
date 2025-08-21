import { db } from '@/lib/db'
import { getIO } from '@/lib/socket'

export interface NotificationData {
  userId: string
  title: string
  message: string
  type: 'TOURNAMENT_UPDATE' | 'CONTRACT_STATUS' | 'SERVICE_ORDER' | 'PAYMENT_STATUS' | 'SYSTEM' | 'CHAT_MESSAGE'
}

export async function sendNotification(data: NotificationData) {
  try {
    // Create notification in database
    const notification = await db.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type
      }
    })

    // Emit real-time notification via Socket.IO
    const io = getIO()
    if (io) {
      io.to(`user:${data.userId}`).emit('notification', notification)
    }

    return notification
  } catch (error) {
    console.error('Error sending notification:', error)
    throw error
  }
}

// Predefined notification functions for common scenarios
export const notifications = {
  // Tournament notifications
  tournamentCreated: async (userId: string, tournamentName: string) => 
    sendNotification({
      userId,
      title: 'Tournament Created',
      message: `Your tournament "${tournamentName}" has been created successfully.`,
      type: 'TOURNAMENT_UPDATE'
    }),

  tournamentStarting: async (userId: string, tournamentName: string) =>
    sendNotification({
      userId,
      title: 'Tournament Starting Soon',
      message: `Tournament "${tournamentName}" is starting in 1 hour.`,
      type: 'TOURNAMENT_UPDATE'
    }),

  tournamentCompleted: async (userId: string, tournamentName: string, position?: string) =>
    sendNotification({
      userId,
      title: 'Tournament Completed',
      message: position 
        ? `Tournament "${tournamentName}" has ended. Your team finished ${position}!`
        : `Tournament "${tournamentName}" has been completed.`,
      type: 'TOURNAMENT_UPDATE'
    }),

  // Contract notifications
  contractReceived: async (userId: string, clanTag: string) =>
    sendNotification({
      userId,
      title: 'New Contract Offer',
      message: `You have received a contract offer from clan ${clanTag}.`,
      type: 'CONTRACT_STATUS'
    }),

  contractAccepted: async (userId: string, clanTag: string) =>
    sendNotification({
      userId,
      title: 'Contract Accepted',
      message: `Your contract with clan ${clanTag} has been accepted.`,
      type: 'CONTRACT_STATUS'
    }),

  contractRejected: async (userId: string, clanTag: string) =>
    sendNotification({
      userId,
      title: 'Contract Rejected',
      message: `Your contract offer to clan ${clanTag} has been rejected.`,
      type: 'CONTRACT_STATUS'
    }),

  contractCompleted: async (userId: string, clanTag: string) =>
    sendNotification({
      userId,
      title: 'Contract Completed',
      message: `Your contract with clan ${clanTag} has been completed successfully.`,
      type: 'CONTRACT_STATUS'
    }),

  // Service order notifications
  serviceOrderCreated: async (userId: string, serviceName: string) =>
    sendNotification({
      userId,
      title: 'Service Order Created',
      message: `Your order for "${serviceName}" has been received.`,
      type: 'SERVICE_ORDER'
    }),

  serviceOrderInProgress: async (userId: string, serviceName: string) =>
    sendNotification({
      userId,
      title: 'Service In Progress',
      message: `Your "${serviceName}" service is now being worked on.`,
      type: 'SERVICE_ORDER'
    }),

  serviceOrderCompleted: async (userId: string, serviceName: string) =>
    sendNotification({
      userId,
      title: 'Service Completed',
      message: `Your "${serviceName}" service has been completed.`,
      type: 'SERVICE_ORDER'
    }),

  // Payment notifications
  paymentReceived: async (userId: string, amount: number, description: string) =>
    sendNotification({
      userId,
      title: 'Payment Received',
      message: `Payment of $${amount} received for ${description}.`,
      type: 'PAYMENT_STATUS'
    }),

  paymentFailed: async (userId: string, amount: number, description: string) =>
    sendNotification({
      userId,
      title: 'Payment Failed',
      message: `Payment of $${amount} for ${description} has failed.`,
      type: 'PAYMENT_STATUS'
    }),

  paymentRefunded: async (userId: string, amount: number, description: string) =>
    sendNotification({
      userId,
      title: 'Payment Refunded',
      message: `Payment of $${amount} for ${description} has been refunded.`,
      type: 'PAYMENT_STATUS'
    }),

  // System notifications
  accountVerified: async (userId: string) =>
    sendNotification({
      userId,
      title: 'Account Verified',
      message: 'Your account has been successfully verified.',
      type: 'SYSTEM'
    }),

  welcome: async (userId: string, username: string) =>
    sendNotification({
      userId,
      title: 'Welcome to Clash Tournaments',
      message: `Welcome ${username}! Start by creating your first tournament or registering as a pusher.`,
      type: 'SYSTEM'
    }),

  // Chat notifications
  newMessage: async (userId: string, senderName: string) =>
    sendNotification({
      userId,
      title: 'New Message',
      message: `You have a new message from ${senderName}.`,
      type: 'CHAT_MESSAGE'
    })
}