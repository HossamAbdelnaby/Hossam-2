import { db } from '@/lib/db'
import { Payment, PaymentMethod, PaymentStatus } from '@prisma/client'
import { PaymentNotifications } from './payment-notifications'

export interface PaymentRequest {
  amount: number
  method: PaymentMethod
  currency?: string
  description?: string
  paymentDetails?: any
  dueDate?: Date
  metadata?: any
  tournamentId?: string
  contractId?: string
  serviceOrderId?: string
  clanId?: string
  userId: string
}

export interface PaymentResponse {
  success: boolean
  payment?: Payment
  error?: string
  paymentUrl?: string
  instructions?: PaymentInstructions
}

export interface PaymentInstructions {
  title: string
  description: string
  steps: string[]
  details: Record<string, any>
  timeline?: string
  contactInfo?: string
}

export interface PaymentMethodInfo {
  method: PaymentMethod
  name: string
  description: string
  icon: string
  processingTime: string
  fees: string
  requirements: string[]
  instructions: PaymentInstructions
}

export class EnhancedPaymentService {
  static async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Validate payment method
      const validation = this.validatePaymentMethod(request.method, request)
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        }
      }

      // Create payment record with enhanced fields
      const payment = await db.payment.create({
        data: {
          amount: request.amount,
          method: request.method,
          currency: request.currency || 'USD',
          description: request.description,
          paymentDetails: request.paymentDetails ? JSON.stringify(request.paymentDetails) : null,
          dueDate: request.dueDate,
          metadata: request.metadata ? JSON.stringify(request.metadata) : null,
          status: PaymentStatus.PENDING,
          userId: request.userId,
          tournamentId: request.tournamentId,
          contractId: request.contractId,
          serviceOrderId: request.serviceOrderId,
          clanId: request.clanId,
        },
      })

      // Send notification for payment created
      await PaymentNotifications.sendPaymentCreatedNotification(payment)

      // Process payment based on method
      const result = await this.processPaymentByMethod(payment, request)
      
      return {
        success: true,
        payment,
        ...result
      }
    } catch (error) {
      console.error('Payment creation error:', error)
      return {
        success: false,
        error: 'Failed to create payment'
      }
    }
  }

  private static validatePaymentMethod(method: PaymentMethod, request: PaymentRequest): { valid: boolean; error?: string } {
    const methodInfo = this.getPaymentMethodInfo(method)
    
    if (!methodInfo) {
      return { valid: false, error: 'Unsupported payment method' }
    }

    // Validate amount based on method
    if (request.amount <= 0) {
      return { valid: false, error: 'Amount must be greater than 0' }
    }

    // Method-specific validations
    switch (method) {
      case PaymentMethod.PAYPAL:
      case PaymentMethod.CREDIT_CARD:
        if (request.amount > 10000) {
          return { valid: false, error: 'Amount exceeds maximum limit for this payment method' }
        }
        break
      
      case PaymentMethod.CASH:
        if (request.amount > 1000) {
          return { valid: false, error: 'Cash payments limited to $1000' }
        }
        break
      
      case PaymentMethod.CRYPTOCURRENCY:
        if (request.amount < 10) {
          return { valid: false, error: 'Minimum cryptocurrency payment is $10' }
        }
        break
    }

    return { valid: true }
  }

  private static async processPaymentByMethod(payment: Payment, request: PaymentRequest): Promise<{ paymentUrl?: string; instructions?: PaymentInstructions }> {
    switch (payment.method) {
      case PaymentMethod.PAYPAL:
        return await this.processPayPalPayment(payment)
      case PaymentMethod.CREDIT_CARD:
        return await this.processStripePayment(payment)
      case PaymentMethod.BINANCE:
      case PaymentMethod.CRYPTOCURRENCY:
        return await this.processCryptoPayment(payment)
      case PaymentMethod.WESTERN_UNION:
        return await this.processWesternUnionPayment(payment)
      case PaymentMethod.BANK_TRANSFER:
        return await this.processBankTransferPayment(payment)
      case PaymentMethod.CASH:
        return await this.processCashPayment(payment)
      case PaymentMethod.MOBILE_MONEY:
        return await this.processMobileMoneyPayment(payment)
      default:
        throw new Error('Unsupported payment method')
    }
  }

  private static async processPayPalPayment(payment: Payment): Promise<{ paymentUrl: string }> {
    try {
      const paypalOrderId = `paypal_${payment.id}_${Date.now()}`
      
      await db.payment.update({
        where: { id: payment.id },
        data: {
          transactionId: paypalOrderId,
          paymentDetails: JSON.stringify({
            orderId: paypalOrderId,
            environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
          })
        },
      })

      return {
        paymentUrl: `/api/payment/paypal/confirm?paymentId=${payment.id}`
      }
    } catch (error) {
      console.error('PayPal payment error:', error)
      throw new Error('Failed to process PayPal payment')
    }
  }

  private static async processStripePayment(payment: Payment): Promise<{ paymentUrl: string }> {
    try {
      const stripePaymentIntentId = `pi_${payment.id}_${Date.now()}`
      
      await db.payment.update({
        where: { id: payment.id },
        data: {
          transactionId: stripePaymentIntentId,
          paymentDetails: JSON.stringify({
            paymentIntentId: stripePaymentIntentId,
            environment: process.env.NODE_ENV === 'production' ? 'production' : 'test'
          })
        },
      })

      return {
        paymentUrl: `/api/payment/stripe/confirm?paymentId=${payment.id}`
      }
    } catch (error) {
      console.error('Stripe payment error:', error)
      throw new Error('Failed to process Stripe payment')
    }
  }

  private static async processCryptoPayment(payment: Payment): Promise<{ instructions: PaymentInstructions }> {
    try {
      const cryptoAddress = process.env.CRYPTO_WALLET_ADDRESS || 'crypto_demo_address'
      const network = payment.method === PaymentMethod.BINANCE ? 'BSC (BEP20)' : 'Ethereum (ERC20)'
      
      await db.payment.update({
        where: { id: payment.id },
        data: {
          transactionId: `crypto_${payment.id}_${Date.now()}`,
          paymentDetails: JSON.stringify({
            address: cryptoAddress,
            network,
            expectedConfirmations: 12,
            memo: `Payment_${payment.id}`
          })
        },
      })

      const instructions: PaymentInstructions = {
        title: 'Cryptocurrency Payment Instructions',
        description: `Please send ${payment.amount} ${payment.currency} to the following wallet address:`,
        steps: [
          `1. Send exactly ${payment.amount} ${payment.currency} to: ${cryptoAddress}`,
          '2. Use the correct network: ' + network,
          '3. Include the memo: Payment_' + payment.id,
          '4. Wait for 12 network confirmations',
          '5. Your payment will be automatically confirmed'
        ],
        details: {
          amount: payment.amount,
          currency: payment.currency,
          address: cryptoAddress,
          network,
          memo: `Payment_${payment.id}`,
          confirmations: 12
        },
        timeline: 'Usually takes 15-30 minutes for confirmation',
        contactInfo: 'support@tournament.com'
      }

      return { instructions }
    } catch (error) {
      console.error('Cryptocurrency payment error:', error)
      throw new Error('Failed to process cryptocurrency payment')
    }
  }

  private static async processWesternUnionPayment(payment: Payment): Promise<{ instructions: PaymentInstructions }> {
    try {
      const receiverInfo = {
        name: process.env.WU_RECEIVER_NAME || 'Tournament Platform',
        city: process.env.WU_RECEIVER_CITY || 'Demo City',
        country: process.env.WU_RECEIVER_COUNTRY || 'Demo Country',
        phone: process.env.WU_RECEIVER_PHONE || '+1234567890'
      }
      
      await db.payment.update({
        where: { id: payment.id },
        data: {
          transactionId: `wu_${payment.id}_${Date.now()}`,
          paymentDetails: JSON.stringify(receiverInfo)
        },
      })

      const instructions: PaymentInstructions = {
        title: 'Western Union Payment Instructions',
        description: `Please send ${payment.amount} ${payment.currency} via Western Union to the following receiver:`,
        steps: [
          `1. Go to any Western Union agent location`,
          `2. Send ${payment.amount} ${payment.currency} to:`,
          `   Name: ${receiverInfo.name}`,
          `   City: ${receiverInfo.city}`,
          `   Country: ${receiverInfo.country}`,
          `3. Keep the Money Transfer Control Number (MTCN)`,
          '4. Send the MTCN and sender details to support@tournament.com',
          '5. Your payment will be confirmed within 24 hours'
        ],
        details: {
          amount: payment.amount,
          currency: payment.currency,
          receiver: receiverInfo,
          expectedProcessingTime: '24 hours'
        },
        timeline: 'Processing time: 24-48 hours',
        contactInfo: 'support@tournament.com'
      }

      return { instructions }
    } catch (error) {
      console.error('Western Union payment error:', error)
      throw new Error('Failed to process Western Union payment')
    }
  }

  private static async processBankTransferPayment(payment: Payment): Promise<{ instructions: PaymentInstructions }> {
    try {
      const bankInfo = {
        accountName: process.env.BANK_ACCOUNT_NAME || 'Tournament Platform',
        accountNumber: process.env.BANK_ACCOUNT_NUMBER || '1234567890',
        bankName: process.env.BANK_NAME || 'Demo Bank',
        iban: process.env.BANK_IBAN || 'DE89370400440532013000',
        swift: process.env.BANK_SWIFT || 'DEUTDEFF'
      }
      
      await db.payment.update({
        where: { id: payment.id },
        data: {
          transactionId: `bank_${payment.id}_${Date.now()}`,
          paymentDetails: JSON.stringify(bankInfo)
        },
      })

      const instructions: PaymentInstructions = {
        title: 'Bank Transfer Instructions',
        description: `Please transfer ${payment.amount} ${payment.currency} to the following bank account:`,
        steps: [
          `1. Transfer ${payment.amount} ${payment.currency} to:`,
          `   Account Name: ${bankInfo.accountName}`,
          `   Account Number: ${bankInfo.accountNumber}`,
          `   Bank: ${bankInfo.bankName}`,
          `   IBAN: ${bankInfo.iban}`,
          `   SWIFT/BIC: ${bankInfo.swift}`,
          '2. Include payment reference: ' + payment.id,
          '3. Send the transfer confirmation to support@tournament.com',
          '4. Your payment will be confirmed within 1-3 business days'
        ],
        details: {
          amount: payment.amount,
          currency: payment.currency,
          bankInfo,
          reference: payment.id
        },
        timeline: 'Processing time: 1-3 business days',
        contactInfo: 'support@tournament.com'
      }

      return { instructions }
    } catch (error) {
      console.error('Bank transfer payment error:', error)
      throw new Error('Failed to process bank transfer payment')
    }
  }

  private static async processCashPayment(payment: Payment): Promise<{ instructions: PaymentInstructions }> {
    try {
      const cashInfo = {
        collectionPoint: process.env.CASH_COLLECTION_POINT || 'Tournament Office',
        address: process.env.CASH_ADDRESS || '123 Demo Street, Demo City',
        contact: process.env.CASH_CONTACT || '+1234567890',
        operatingHours: '9:00 AM - 5:00 PM, Monday to Friday'
      }
      
      await db.payment.update({
        where: { id: payment.id },
        data: {
          transactionId: `cash_${payment.id}_${Date.now()}`,
          paymentDetails: JSON.stringify(cashInfo)
        },
      })

      const instructions: PaymentInstructions = {
        title: 'Cash Payment Instructions',
        description: `Please bring ${payment.amount} ${payment.currency} in cash to our collection point:`,
        steps: [
          `1. Visit our collection point during operating hours`,
          `2. Bring exactly ${payment.amount} ${payment.currency} in cash`,
          '3. Mention your payment reference: ' + payment.id,
          '4. Collect your payment receipt',
          '5. Your payment will be confirmed immediately'
        ],
        details: {
          amount: payment.amount,
          currency: payment.currency,
          collectionPoint: cashInfo,
          reference: payment.id
        },
        timeline: 'Immediate confirmation upon payment',
        contactInfo: cashInfo.contact
      }

      return { instructions }
    } catch (error) {
      console.error('Cash payment error:', error)
      throw new Error('Failed to process cash payment')
    }
  }

  private static async processMobileMoneyPayment(payment: Payment): Promise<{ instructions: PaymentInstructions }> {
    try {
      const mobileMoneyInfo = {
        provider: process.env.MOBILE_MONEY_PROVIDER || 'MTN Mobile Money',
        phoneNumber: process.env.MOBILE_MONEY_NUMBER || '+1234567890',
        accountName: process.env.MOBILE_MONEY_ACCOUNT || 'Tournament Platform'
      }
      
      await db.payment.update({
        where: { id: payment.id },
        data: {
          transactionId: `mobile_${payment.id}_${Date.now()}`,
          paymentDetails: JSON.stringify(mobileMoneyInfo)
        },
      })

      const instructions: PaymentInstructions = {
        title: 'Mobile Money Payment Instructions',
        description: `Please send ${payment.amount} ${payment.currency} via mobile money:`,
        steps: [
          `1. Open your ${mobileMoneyInfo.provider} app`,
          `2. Select "Send Money" or "Transfer"`,
          `3. Enter amount: ${payment.amount} ${payment.currency}`,
          `4. Enter recipient number: ${mobileMoneyInfo.phoneNumber}`,
          `5. Enter recipient name: ${mobileMoneyInfo.accountName}`,
          '6. Confirm the transaction',
          '7. Your payment will be confirmed within minutes'
        ],
        details: {
          amount: payment.amount,
          currency: payment.currency,
          provider: mobileMoneyInfo.provider,
          phoneNumber: mobileMoneyInfo.phoneNumber,
          accountName: mobileMoneyInfo.accountName
        },
        timeline: 'Processing time: 5-15 minutes',
        contactInfo: 'support@tournament.com'
      }

      return { instructions }
    } catch (error) {
      console.error('Mobile money payment error:', error)
      throw new Error('Failed to process mobile money payment')
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
          error: 'Payment not found'
        }
      }

      // Update payment status to completed
      const updatedPayment = await db.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.COMPLETED,
          completedAt: new Date(),
          paymentDetails: transactionDetails ? JSON.stringify({
            ...JSON.parse(payment.paymentDetails || '{}'),
            confirmation: transactionDetails
          }) : payment.paymentDetails
        },
      })

      // Send notification for payment completed
      await PaymentNotifications.sendPaymentCompletedNotification(updatedPayment)

      return {
        success: true,
        payment: updatedPayment
      }
    } catch (error) {
      console.error('Payment confirmation error:', error)
      return {
        success: false,
        error: 'Failed to confirm payment'
      }
    }
  }

  static getPaymentMethodInfo(method: PaymentMethod): PaymentMethodInfo | null {
    const methods: Record<PaymentMethod, PaymentMethodInfo> = {
      [PaymentMethod.PAYPAL]: {
        method: PaymentMethod.PAYPAL,
        name: 'PayPal',
        description: 'Fast and secure online payment',
        icon: 'PayPal',
        processingTime: 'Instant',
        fees: '2.9% + $0.30',
        requirements: ['PayPal account', 'Valid email'],
        instructions: {
          title: 'PayPal Payment',
          description: 'Complete your payment securely through PayPal',
          steps: [
            '1. Click "Pay with PayPal"',
            '2. Log in to your PayPal account',
            '3. Confirm the payment amount',
            '4. Complete the payment',
            '5. You will be redirected back'
          ],
          details: {
            security: 'Buyer protection included',
            speed: 'Instant confirmation'
          },
          timeline: 'Immediate',
          contactInfo: 'support@paypal.com'
        }
      },
      [PaymentMethod.CREDIT_CARD]: {
        method: PaymentMethod.CREDIT_CARD,
        name: 'Credit/Debit Card',
        description: 'Pay securely with your card',
        icon: 'CreditCard',
        processingTime: 'Instant',
        fees: '2.9% + $0.30',
        requirements: ['Valid credit/debit card', 'Card security code'],
        instructions: {
          title: 'Card Payment',
          description: 'Enter your card details securely',
          steps: [
            '1. Enter card number',
            '2. Enter expiry date',
            '3. Enter CVV code',
            '4. Enter billing address',
            '5. Confirm payment'
          ],
          details: {
            security: '256-bit SSL encryption',
            speed: 'Instant confirmation'
          },
          timeline: 'Immediate',
          contactInfo: 'support@tournament.com'
        }
      },
      [PaymentMethod.BANK_TRANSFER]: {
        method: PaymentMethod.BANK_TRANSFER,
        name: 'Bank Transfer',
        description: 'Direct bank transfer',
        icon: 'Building2',
        processingTime: '1-3 business days',
        fees: 'Variable (check with your bank)',
        requirements: ['Bank account', 'Online banking'],
        instructions: {
          title: 'Bank Transfer',
          description: 'Transfer directly from your bank account',
          steps: [
            '1. Log in to your online banking',
            '2. Add recipient details',
            '3. Enter payment amount',
            '4. Include payment reference',
            '5. Confirm transfer'
          ],
          details: {
            security: 'Bank-level security',
            speed: '1-3 business days'
          },
          timeline: '1-3 business days',
          contactInfo: 'support@tournament.com'
        }
      },
      [PaymentMethod.CRYPTOCURRENCY]: {
        method: PaymentMethod.CRYPTOCURRENCY,
        name: 'Cryptocurrency',
        description: 'Pay with Bitcoin, Ethereum, or other crypto',
        icon: 'Bitcoin',
        processingTime: '15-30 minutes',
        fees: 'Network fees apply',
        requirements: ['Crypto wallet', 'Basic crypto knowledge'],
        instructions: {
          title: 'Cryptocurrency Payment',
          description: 'Pay with your preferred cryptocurrency',
          steps: [
            '1. Send crypto to provided address',
            '2. Wait for confirmations',
            '3. Payment auto-confirmed',
            '4. Receive confirmation email'
          ],
          details: {
            security: 'Blockchain security',
            speed: '15-30 minutes'
          },
          timeline: '15-30 minutes',
          contactInfo: 'support@tournament.com'
        }
      },
      [PaymentMethod.CASH]: {
        method: PaymentMethod.CASH,
        name: 'Cash Payment',
        description: 'Pay in person at our office',
        icon: 'Banknote',
        processingTime: 'Immediate',
        fees: 'No fees',
        requirements: ['In-person visit', 'Valid ID'],
        instructions: {
          title: 'Cash Payment',
          description: 'Pay in person at our collection point',
          steps: [
            '1. Visit our office',
            '2. Bring exact amount',
            '3. Present valid ID',
            '4. Get receipt',
            '5. Payment confirmed'
          ],
          details: {
            security: 'In-person verification',
            speed: 'Immediate'
          },
          timeline: 'Immediate',
          contactInfo: '+1234567890'
        }
      },
      [PaymentMethod.MOBILE_MONEY]: {
        method: PaymentMethod.MOBILE_MONEY,
        name: 'Mobile Money',
        description: 'Pay with mobile money services',
        icon: 'Smartphone',
        processingTime: '5-15 minutes',
        fees: 'Provider fees apply',
        requirements: ['Mobile money account', 'Phone'],
        instructions: {
          title: 'Mobile Money Payment',
          description: 'Pay using your mobile money service',
          steps: [
            '1. Open mobile money app',
            '2. Select send money',
            '3. Enter amount and number',
            '4. Confirm transaction',
            '5. Get confirmation'
          ],
          details: {
            security: 'PIN protected',
            speed: '5-15 minutes'
          },
          timeline: '5-15 minutes',
          contactInfo: 'support@tournament.com'
        }
      },
      [PaymentMethod.WESTERN_UNION]: {
        method: PaymentMethod.WESTERN_UNION,
        name: 'Western Union',
        description: 'Send money via Western Union',
        icon: 'Globe',
        processingTime: '24-48 hours',
        fees: 'Variable',
        requirements: ['ID', 'Western Union agent'],
        instructions: {
          title: 'Western Union Payment',
          description: 'Send money through Western Union',
          steps: [
            '1. Visit Western Union agent',
            '2. Fill out send form',
            '3. Pay agent fees',
            '4. Get MTCN number',
            '5. Send MTCN to us'
          ],
          details: {
            security: 'ID verification required',
            speed: '24-48 hours'
          },
          timeline: '24-48 hours',
          contactInfo: 'support@tournament.com'
        }
      },
      [PaymentMethod.BINANCE]: {
        method: PaymentMethod.BINANCE,
        name: 'Binance Pay',
        description: 'Pay with Binance',
        icon: 'Coins',
        processingTime: '15-30 minutes',
        fees: 'Network fees apply',
        requirements: ['Binance account', 'Binance app'],
        instructions: {
          title: 'Binance Payment',
          description: 'Pay using Binance Pay',
          steps: [
            '1. Open Binance app',
            '2. Scan QR code',
            '3. Confirm payment',
            '4. Wait confirmation',
            '5. Get receipt'
          ],
          details: {
            security: 'Binance security',
            speed: '15-30 minutes'
          },
          timeline: '15-30 minutes',
          contactInfo: 'support@binance.com'
        }
      }
    }

    return methods[method] || null
  }

  static getAvailablePaymentMethods(): PaymentMethodInfo[] {
    return Object.values(PaymentMethod).map(method => this.getPaymentMethodInfo(method)).filter(Boolean) as PaymentMethodInfo[]
  }

  static async getPaymentMethodsForContext(context: {
    type: 'tournament' | 'clan' | 'service'
    amount?: number
    currency?: string
  }): Promise<PaymentMethodInfo[]> {
    const allMethods = this.getAvailablePaymentMethods()
    
    // Filter methods based on context
    let filteredMethods = allMethods

    // Filter by amount
    if (context.amount) {
      filteredMethods = filteredMethods.filter(method => {
        switch (method.method) {
          case PaymentMethod.CASH:
            return context.amount <= 1000
          case PaymentMethod.CRYPTOCURRENCY:
            return context.amount >= 10
          case PaymentMethod.PAYPAL:
          case PaymentMethod.CREDIT_CARD:
            return context.amount <= 10000
          default:
            return true
        }
      })
    }

    return filteredMethods
  }
}