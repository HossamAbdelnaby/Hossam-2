import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

async function getUserFromRequest(request: NextRequest) {
  try {
    // Get token from Authorization header or cookies
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('auth-token')?.value ||
                  request.cookies.get('token')?.value ||
                  request.cookies.get('next-auth.session-token')?.value

    if (!token) {
      return null
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return null
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true
      }
    })

    return user
  } catch (error) {
    console.error('Authentication error:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tournaments = await db.tournament.findMany({
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            teams: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ tournaments })
  } catch (error) {
    console.error('Error fetching tournaments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      description,
      host,
      prizeAmount,
      maxTeams,
      registrationStart,
      registrationEnd,
      tournamentStart,
      tournamentEnd,
      bracketType,
      packageType
    } = body

    // Validate required fields
    if (!name || !host || !registrationStart || !tournamentStart) {
      return NextResponse.json(
        { error: 'Missing required fields: name, host, registrationStart, tournamentStart' },
        { status: 400 }
      )
    }

    // Create tournament
    const tournament = await db.tournament.create({
      data: {
        name,
        description: description || null,
        host,
        prizeAmount: prizeAmount || 0,
        maxTeams: maxTeams || 16,
        registrationStart: new Date(registrationStart),
        registrationEnd: registrationEnd ? new Date(registrationEnd) : null,
        tournamentStart: new Date(tournamentStart),
        tournamentEnd: tournamentEnd ? new Date(tournamentEnd) : null,
        bracketType,
        packageType,
        organizerId: user.id,
        status: 'DRAFT'
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            teams: true
          }
        }
      }
    })

    return NextResponse.json({ 
      message: 'Tournament created successfully',
      tournament 
    })
  } catch (error) {
    console.error('Error creating tournament:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}