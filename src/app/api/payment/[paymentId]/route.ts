import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { PaymentService } from '@/lib/payment/payment-service'

export async function GET(request: NextRequest, { params }: { params: { paymentId: string } }) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const payment = await PaymentService.getPayment(params.paymentId)

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Check if payment belongs to the authenticated user
    if (payment.userId !== decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({
      payment,
    })
  } catch (error) {
    console.error('Get payment error:', error)
    return NextResponse.json(
      { error: 'Failed to get payment' },
      { status: 500 }
    )
  }
}