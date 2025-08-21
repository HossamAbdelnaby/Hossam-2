import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
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
      name,
      tag,
      leagueLevel,
      membersNeeded,
      offeredPayment,
      terms,
    } = body

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Clan name is required' },
        { status: 400 }
      )
    }

    if (!tag || !tag.trim()) {
      return NextResponse.json(
        { error: 'Clan tag is required' },
        { status: 400 }
      )
    }

    if (!leagueLevel || leagueLevel < 1 || leagueLevel > 3) {
      return NextResponse.json(
        { error: 'Valid league level (1-3) is required' },
        { status: 400 }
      )
    }

    if (!membersNeeded || membersNeeded < 1 || membersNeeded > 15) {
      return NextResponse.json(
        { error: 'Valid members needed (1-15) is required' },
        { status: 400 }
      )
    }

    if (!offeredPayment || offeredPayment < 0) {
      return NextResponse.json(
        { error: 'Valid payment amount is required' },
        { status: 400 }
      )
    }

    if (!terms || !terms.trim()) {
      return NextResponse.json(
        { error: 'Terms and conditions are required' },
        { status: 400 }
      )
    }

    console.log('=== CWL REGISTRATION DEBUG ===')
    console.log('Token:', token ? 'Token exists' : 'No token')
    console.log('Decoded:', decoded)
    console.log('User ID:', decoded?.userId)
    console.log('Request body:', body)
    
    // First, let's test if we can find the user
    try {
      const user = await db.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true }
      })
      console.log('User found:', user)
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }
    } catch (userError) {
      console.error('User query error:', userError)
      return NextResponse.json(
        { error: 'Failed to verify user' },
        { status: 500 }
      )
    }
    
    // Check if user already has a clan registered
    const existingClan = await db.clan.findFirst({
      where: { ownerId: decoded.userId },
    })

    if (existingClan) {
      return NextResponse.json(
        { error: 'You already have a clan registered. Use PUT to update.' },
        { status: 400 }
      )
    }

    // Create CWL clan
    const clan = await db.clan.create({
      data: {
        name: name.trim(),
        tag: tag.trim(),
        leagueLevel,
        membersNeeded,
        offeredPayment,
        terms: terms.trim(),
        isActive: true,
        ownerId: decoded.userId,
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({
      message: 'Clan registered successfully',
      clan,
    })
  } catch (error) {
    console.error('CWL clan registration error:', error)
    return NextResponse.json(
      { error: 'Failed to register clan' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')

    const skip = (page - 1) * limit

    const [clans, total] = await Promise.all([
      db.clan.findMany({
        where: {
          isActive: true,
        },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      db.clan.count({
        where: {
          isActive: true,
        },
      }),
    ])

    return NextResponse.json({
      clans,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('CWL clans fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch CWL clans' },
      { status: 500 }
    )
  }
}