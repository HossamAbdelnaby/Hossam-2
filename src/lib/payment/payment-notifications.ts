import { sendNotification } from '@/lib/notifications/send-notification'
import { Payment, PaymentStatus, NotificationType } from '@prisma/client'

export class PaymentNotifications {
  static async sendPaymentCreatedNotification(payment: Payment) {
    try {
      const title = 'Payment Created'
      const message = `Your payment of $${payment.amount} has been created and is pending processing.`
      
      await sendNotification({
        userId: payment.userId,
        title,
        message,
        type: NotificationType.PAYMENT_STATUS,
      })
    } catch (error) {
      console.error('Failed to send payment created notification:', error)
    }
  }

  static async sendPaymentCompletedNotification(payment: Payment) {
    try {
      const title = 'Payment Completed'
      let message = `Your payment of $${payment.amount} has been successfully processed.`

      // Add specific details based on what the payment was for
      if (payment.tournamentId) {
        message += ' Your tournament is now active and ready for participants.'
      } else if (payment.contractId) {
        message += ' Your contract has been confirmed.'
      } else if (payment.serviceOrderId) {
        message += ' Your service order has been activated.'
      }
      
      await sendNotification({
        userId: payment.userId,
        title,
        message,
        type: NotificationType.PAYMENT_STATUS,
      })
    } catch (error) {
      console.error('Failed to send payment completed notification:', error)
    }
  }

  static async sendPaymentFailedNotification(payment: Payment, reason?: string) {
    try {
      const title = 'Payment Failed'
      let message = `Your payment of $${payment.amount} has failed.`

      if (reason) {
        message += ` Reason: ${reason}`
      }

      message += ' Please try again or contact support.'
      
      await sendNotification({
        userId: payment.userId,
        title,
        message,
        type: NotificationType.PAYMENT_STATUS,
      })
    } catch (error) {
      console.error('Failed to send payment failed notification:', error)
    }
  }

  static async sendPaymentRefundedNotification(payment: Payment) {
    try {
      const title = 'Payment Refunded'
      const message = `Your payment of $${payment.amount} has been refunded. The refund should appear in your account within 5-7 business days.`
      
      await sendNotification({
        userId: payment.userId,
        title,
        message,
        type: NotificationType.PAYMENT_STATUS,
      })
    } catch (error) {
      console.error('Failed to send payment refunded notification:', error)
    }
  }

  static async sendPaymentReminderNotification(payment: Payment) {
    try {
      const title = 'Payment Reminder'
      const message = `You have a pending payment of $${payment.amount}. Please complete your payment to activate your service/tournament.`
      
      await sendNotification({
        userId: payment.userId,
        title,
        message,
        type: NotificationType.PAYMENT_STATUS,
      })
    } catch (error) {
      console.error('Failed to send payment reminder notification:', error)
    }
  }
}