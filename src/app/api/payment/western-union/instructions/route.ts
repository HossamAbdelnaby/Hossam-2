import { NextRequest, NextResponse } from 'next/server'
import { PaymentService } from '@/lib/payment/payment-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('paymentId')

    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 })
    }

    // Get payment details
    const payment = await PaymentService.getPayment(paymentId)

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Western Union payment instructions
    const instructions = {
      amount: payment.amount,
      currency: 'USD',
      receiver: {
        name: 'Tournament Platform',
        city: 'Demo City',
        country: 'United States',
      },
      estimatedTime: '1-3 business days',
      steps: [
        '1. Visit your nearest Western Union location',
        '2. Fill out the Send Money form',
        '3. Provide receiver information as shown above',
        '4. Enter the exact amount to send',
        '5. Pay the transfer fee (if any)',
        '6. Get the Money Transfer Control Number (MTCN)',
        '7. Keep your receipt safe',
        '8. Send the MTCN and receipt to our support team',
      ],
      supportNote: 'Please email the MTCN and a photo of your receipt to our support team for manual confirmation.',
      supportEmail: 'support@tournamentplatform.com',
    }

    return NextResponse.json({
      message: 'Western Union payment instructions',
      instructions,
      payment,
    })
  } catch (error) {
    console.error('Western Union instructions error:', error)
    return NextResponse.json(
      { error: 'Failed to get Western Union instructions' },
      { status: 500 }
    )
  }
}