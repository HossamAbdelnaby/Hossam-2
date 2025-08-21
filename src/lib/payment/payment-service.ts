import { db } from '@/lib/db'
import { Payment, PaymentMethod, PaymentStatus } from '@prisma/client'
import { PaymentNotifications } from './payment-notifications'

export interface PaymentRequest {
  amount: number
  method: PaymentMethod
  tournamentId?: string
  contractId?: string
  serviceOrderId?: string
  userId: string
}

export interface PaymentResponse {
  success: boolean
  payment?: Payment
  error?: string
  paymentUrl?: string
}

export class PaymentService {
  static async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Create payment record
      const payment = await db.payment.create({
        data: {
          amount: request.amount,
          method: request.method,
          status: PaymentStatus.PENDING,
          userId: request.userId,
          tournamentId: request.tournamentId,
          contractId: request.contractId,
          serviceOrderId: request.serviceOrderId,
        },
      })

      // Send notification for payment created
      await PaymentNotifications.sendPaymentCreatedNotification(payment)

      // Process payment based on method
      switch (request.method) {
        case PaymentMethod.PAYPAL:
          return await this.processPayPalPayment(payment)
        case PaymentMethod.CREDIT_CARD:
          return await this.processStripePayment(payment)
        case PaymentMethod.BINANCE:
          return await this.processBinancePayment(payment)
        case PaymentMethod.WESTERN_UNION:
          return await this.processWesternUnionPayment(payment)
        default:
          return {
            success: false,
            error: 'Unsupported payment method',
          }
      }
    } catch (error) {
      console.error('Payment creation error:', error)
      return {
        success: false,
        error: 'Failed to create payment',
      }
    }
  }

  private static async processPayPalPayment(payment: Payment): Promise<PaymentResponse> {
    try {
      // In a real implementation, you would integrate with PayPal API
      // For now, we'll simulate the process
      
      // Create PayPal order
      const paypalOrderId = `paypal_${payment.id}_${Date.now()}`
      
      // Update payment with transaction ID
      await db.payment.update({
        where: { id: payment.id },
        data: {
          transactionId: paypalOrderId,
        },
      })

      // In real implementation, return PayPal approval URL
      // For demo purposes, we'll simulate immediate approval
      return {
        success: true,
        payment,
        paymentUrl: `/api/payment/paypal/confirm?paymentId=${payment.id}`,
      }
    } catch (error) {
      console.error('PayPal payment error:', error)
      return {
        success: false,
        error: 'Failed to process PayPal payment',
      }
    }
  }

  private static async processStripePayment(payment: Payment): Promise<PaymentResponse> {
    try {
      // In a real implementation, you would integrate with Stripe API
      // For now, we'll simulate the process
      
      const stripePaymentIntentId = `pi_${payment.id}_${Date.now()}`
      
      // Update payment with transaction ID
      await db.payment.update({
        where: { id: payment.id },
        data: {
          transactionId: stripePaymentIntentId,
        },
      })

      // In real implementation, return Stripe payment intent client secret
      // For demo purposes, we'll simulate immediate approval
      return {
        success: true,
        payment,
        paymentUrl: `/api/payment/stripe/confirm?paymentId=${payment.id}`,
      }
    } catch (error) {
      console.error('Stripe payment error:', error)
      return {
        success: false,
        error: 'Failed to process Stripe payment',
      }
    }
  }

  private static async processBinancePayment(payment: Payment): Promise<PaymentResponse> {
    try {
      // For Binance payments, we'll provide instructions
      const binanceAddress = process.env.BINANCE_WALLET_ADDRESS || 'binance_demo_address'
      
      // Update payment with transaction ID
      await db.payment.update({
        where: { id: payment.id },
        data: {
          transactionId: `binance_${payment.id}_${Date.now()}`,
        },
      })

      return {
        success: true,
        payment,
        paymentUrl: `/api/payment/binance/instructions?paymentId=${payment.id}`,
      }
    } catch (error) {
      console.error('Binance payment error:', error)
      return {
        success: false,
        error: 'Failed to process Binance payment',
      }
    }
  }

  private static async processWesternUnionPayment(payment: Payment): Promise<PaymentResponse> {
    try {
      // For Western Union, we'll provide instructions
      const westernUnionInfo = {
        receiverName: 'Tournament Platform',
        city: 'Demo City',
        country: 'Demo Country',
      }
      
      // Update payment with transaction ID
      await db.payment.update({
        where: { id: payment.id },
        data: {
          transactionId: `wu_${payment.id}_${Date.now()}`,
        },
      })

      return {
        success: true,
        payment,
        paymentUrl: `/api/payment/western-union/instructions?paymentId=${payment.id}`,
      }
    } catch (error) {
      console.error('Western Union payment error:', error)
      return {
        success: false,
        error: 'Failed to process Western Union payment',
      }
    }
  }

  static async confirmPayment(paymentId: string, transactionDetails?: any): Promise<PaymentResponse> {
    try {
      const payment = await db.payment.findUnique({
        where: { id: paymentId },
      })

      if (!payment) {
        return {
          success: false,
          error: 'Payment not found',
        }
      }

      // Update payment status to completed
      const updatedPayment = await db.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.COMPLETED,
        },
      })

      // Send notification for payment completed
      await PaymentNotifications.sendPaymentCompletedNotification(updatedPayment)

      return {
        success: true,
        payment: updatedPayment,
      }
    } catch (error) {
      console.error('Payment confirmation error:', error)
      return {
        success: false,
        error: 'Failed to confirm payment',
      }
    }
  }

  static async failPayment(paymentId: string, reason: string): Promise<PaymentResponse> {
    try {
      const payment = await db.payment.findUnique({
        where: { id: paymentId },
      })

      if (!payment) {
        return {
          success: false,
          error: 'Payment not found',
        }
      }

      // Update payment status to failed
      const updatedPayment = await db.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.FAILED,
        },
      })

      // Send notification for payment failed
      await PaymentNotifications.sendPaymentFailedNotification(updatedPayment, reason)

      return {
        success: true,
        payment: updatedPayment,
      }
    } catch (error) {
      console.error('Payment failure error:', error)
      return {
        success: false,
        error: 'Failed to mark payment as failed',
      }
    }
  }

  static async getPayment(paymentId: string): Promise<Payment | null> {
    try {
      return await db.payment.findUnique({
        where: { id: paymentId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          tournament: {
            select: {
              id: true,
              name: true,
            },
          },
          contract: {
            select: {
              id: true,
              message: true,
            },
          },
          serviceOrder: {
            select: {
              id: true,
              service: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      })
    } catch (error) {
      console.error('Get payment error:', error)
      return null
    }
  }

  static async getUserPayments(userId: string): Promise<Payment[]> {
    try {
      return await db.payment.findMany({
        where: { userId },
        include: {
          tournament: {
            select: {
              id: true,
              name: true,
            },
          },
          contract: {
            select: {
              id: true,
              message: true,
            },
          },
          serviceOrder: {
            select: {
              id: true,
              service: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
    } catch (error) {
      console.error('Get user payments error:', error)
      return []
    }
  }
}