import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Find the clan owned by this user
    const clan = await db.clan.findFirst({
      where: {
        ownerId: decoded.userId,
        isActive: true,
      },
    })

    return NextResponse.json({
      clan,
    })
  } catch (error) {
    console.error('Failed to fetch user clan:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clan information' },
      { status: 500 }
    )
  }
}