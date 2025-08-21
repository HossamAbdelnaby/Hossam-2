import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request })
    
    if (!token?.sub || (token.role !== 'ADMIN' && token.role !== 'MODERATOR')) {
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