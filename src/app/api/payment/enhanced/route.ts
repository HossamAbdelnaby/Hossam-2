import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { EnhancedPaymentService, PaymentRequest } from '@/lib/payment/enhanced-payment-service'
import { PaymentMethod } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      amount,
      method,
      currency = 'USD',
      description,
      paymentDetails,
      dueDate,
      metadata,
      tournamentId,
      contractId,
      serviceOrderId,
      clanId
    } = body

    // Validate required fields
    if (!amount || !method) {
      return NextResponse.json({ 
        error: 'Amount and payment method are required' 
      }, { status: 400 })
    }

    // Validate payment method
    if (!Object.values(PaymentMethod).includes(method)) {
      return NextResponse.json({ 
        error: 'Invalid payment method' 
      }, { status: 400 })
    }

    // Validate amount
    if (amount <= 0) {
      return NextResponse.json({ 
        error: 'Amount must be greater than 0' 
      }, { status: 400 })
    }

    // Validate context (at least one context must be provided)
    if (!tournamentId && !contractId && !serviceOrderId && !clanId) {
      return NextResponse.json({ 
        error: 'Payment context is required (tournamentId, contractId, serviceOrderId, or clanId)' 
      }, { status: 400 })
    }

    // Create payment request
    const paymentRequest: PaymentRequest = {
      amount,
      method,
      currency,
      description,
      paymentDetails,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      metadata,
      tournamentId,
      contractId,
      serviceOrderId,
      clanId,
      userId: session.user.id
    }

    // Process payment
    const result = await EnhancedPaymentService.createPayment(paymentRequest)

    if (!result.success) {
      return NextResponse.json({ 
        error: result.error || 'Failed to create payment' 
      }, { status: 400 })
    }

    // Return payment details with instructions
    return NextResponse.json({
      success: true,
      payment: result.payment,
      paymentUrl: result.paymentUrl,
      instructions: result.instructions
    })

  } catch (error) {
    console.error('Payment creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const context = searchParams.get('context') // 'tournament', 'clan', 'service'
    const contextId = searchParams.get('contextId')
    const amount = searchParams.get('amount')

    // Get available payment methods for the context
    const paymentMethods = await EnhancedPaymentService.getPaymentMethodsForContext({
      type: (context as any) || 'tournament',
      amount: amount ? parseFloat(amount) : undefined
    })

    return NextResponse.json({
      success: true,
      paymentMethods,
      context: {
        type: context,
        id: contextId,
        amount: amount ? parseFloat(amount) : undefined
      }
    })

  } catch (error) {
    console.error('Failed to fetch payment methods:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
      { status: 500 }
    )
  }
}