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

    // Binance payment instructions
    const instructions = {
      amount: payment.amount,
      currency: 'USDT', // Assuming USDT for Binance payments
      walletAddress: process.env.BINANCE_WALLET_ADDRESS || 'binance_demo_address',
      network: 'BSC (Binance Smart Chain)',
      memo: `Payment_${payment.id}`,
      estimatedTime: '5-30 minutes',
      steps: [
        '1. Open your Binance app or website',
        '2. Go to Wallet → Withdraw → Crypto',
        '3. Select USDT and BSC network',
        '4. Enter the wallet address provided',
        '5. Enter the exact amount',
        '6. Add the memo/reference if required',
        '7. Complete the withdrawal',
        '8. Contact support once payment is sent',
      ],
      supportNote: 'Please contact our support team with your transaction ID after sending the payment for manual confirmation.',
    }

    return NextResponse.json({
      message: 'Binance payment instructions',
      instructions,
      payment,
    })
  } catch (error) {
    console.error('Binance instructions error:', error)
    return NextResponse.json(
      { error: 'Failed to get Binance instructions' },
      { status: 500 }
    )
  }
}