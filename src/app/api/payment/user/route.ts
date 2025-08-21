import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { PaymentService } from '@/lib/payment/payment-service'

export async function GET(request: NextRequest) {
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

    const payments = await PaymentService.getUserPayments(decoded.userId)

    return NextResponse.json({
      payments,
    })
  } catch (error) {
    console.error('Get user payments error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user payments' },
      { status: 500 }
    )
  }
}