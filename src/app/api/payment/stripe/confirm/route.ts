import { NextRequest, NextResponse } from 'next/server'
import { PaymentService } from '@/lib/payment/payment-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('paymentId')

    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 })
    }

    // Confirm payment
    const result = await PaymentService.confirmPayment(paymentId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Stripe payment confirmed successfully',
      payment: result.payment,
    })
  } catch (error) {
    console.error('Stripe confirmation error:', error)
    return NextResponse.json(
      { error: 'Failed to confirm Stripe payment' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { paymentId, transactionDetails } = body

    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 })
    }

    // Confirm payment with transaction details
    const result = await PaymentService.confirmPayment(paymentId, transactionDetails)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Stripe payment confirmed successfully',
      payment: result.payment,
    })
  } catch (error) {
    console.error('Stripe confirmation error:', error)
    return NextResponse.json(
      { error: 'Failed to confirm Stripe payment' },
      { status: 500 }
    )
  }
}