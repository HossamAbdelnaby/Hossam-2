import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      amount,
      currency,
      paymentMethod,
      paymentType,
      description,
      tournamentId,
      clanId,
      clanApplicationId,
      paymentDetails
    } = body

    // Validate required fields
    if (!amount || !currency || !paymentMethod || !paymentType || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create payment record
    const payment = await db.payment.create({
      data: {
        amount: parseFloat(amount),
        currency,
        type: paymentType,
        method: paymentMethod,
        status: 'PENDING',
        description,
        userId: session.user.id,
        tournamentId,
        clanId,
        clanApplicationId,
        paymentDetails: JSON.stringify(paymentDetails || {}),
        metadata: JSON.stringify({
          createdAt: new Date().toISOString(),
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        })
      }
    })

    return NextResponse.json({
      message: 'Payment record created successfully',
      payment: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        paymentMethod: payment.method,
        paymentType: payment.type,
        description: payment.description,
        createdAt: payment.createdAt
      }
    })

  } catch (error) {
    console.error('Payment creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment record' },
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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const paymentType = searchParams.get('type')
    const status = searchParams.get('status')

    const skip = (page - 1) * limit

    const where: any = {
      userId: session.user.id
    }

    if (paymentType) {
      where.type = paymentType
    }

    if (status) {
      where.status = status
    }

    const [payments, total] = await Promise.all([
      db.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          tournament: {
            select: {
              id: true,
              name: true,
              url: true
            }
          },
          clan: {
            select: {
              id: true,
              name: true,
              tag: true
            }
          }
        }
      }),
      db.payment.count({ where })
    ])

    return NextResponse.json({
      payments: payments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        type: payment.type,
        method: payment.method,
        status: payment.status,
        description: payment.description,
        createdAt: payment.createdAt,
        completedAt: payment.completedAt,
        tournament: payment.tournament,
        clan: payment.clan
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Payment fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}