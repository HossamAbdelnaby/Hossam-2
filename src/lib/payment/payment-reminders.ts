import { db } from '@/lib/db'
import { PaymentStatus } from '@prisma/client'
import { PaymentNotifications } from './payment-notifications'

export class PaymentReminders {
  static async sendPendingPaymentReminders() {
    try {
      // Find all pending payments older than 1 hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      
      const pendingPayments = await db.payment.findMany({
        where: {
          status: PaymentStatus.PENDING,
          createdAt: {
            lt: oneHourAgo,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      })

      for (const payment of pendingPayments) {
        // Send reminder notification
        await PaymentNotifications.sendPaymentReminderNotification(payment)
        
        console.log(`Sent payment reminder for payment ${payment.id} to user ${payment.user.email}`)
      }

      return {
        success: true,
        remindersSent: pendingPayments.length,
      }
    } catch (error) {
      console.error('Failed to send payment reminders:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send reminders',
      }
    }
  }

  static async getPendingPaymentsStats() {
    try {
      const stats = await db.payment.groupBy({
        by: ['status'],
        _count: {
          id: true,
        },
        _sum: {
          amount: true,
        },
      })

      const pendingStats = stats.find(stat => stat.status === PaymentStatus.PENDING)
      
      return {
        pendingCount: pendingStats?._count.id || 0,
        pendingAmount: pendingStats?._sum.amount || 0,
        totalStats: stats,
      }
    } catch (error) {
      console.error('Failed to get payment stats:', error)
      return {
        pendingCount: 0,
        pendingAmount: 0,
        totalStats: [],
      }
    }
  }
}