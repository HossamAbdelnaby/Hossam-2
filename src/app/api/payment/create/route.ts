import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { PaymentService } from '@/lib/payment/payment-service'
import { PaymentMethod } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const {
      amount,
      method,
      tournamentId,
      contractId,
      serviceOrderId,
    } = body

    // Validate required fields
    if (!amount || !method) {
      return NextResponse.json(
        { error: 'Amount and payment method are required' },
        { status: 400 }
      )
    }

    // Validate payment method
    if (!Object.values(PaymentMethod).includes(method)) {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      )
    }

    // Validate amount
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      )
    }

    // Create payment
    const paymentRequest = {
      amount,
      method,
      tournamentId,
      contractId,
      serviceOrderId,
      userId: decoded.userId,
    }

    const result = await PaymentService.createPayment(paymentRequest)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Payment created successfully',
      payment: result.payment,
      paymentUrl: result.paymentUrl,
    })
  } catch (error) {
    console.error('Payment creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    )
  }
}