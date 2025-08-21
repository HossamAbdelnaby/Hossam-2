import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find the clan owned by the current user
    const clan = await db.clan.findFirst({
      where: {
        ownerId: session.user.id,
        isActive: true
      }
    })

    if (!clan) {
      return NextResponse.json({ error: 'Clan not found' }, { status: 404 })
    }

    // Get all applications for this clan
    const applications = await db.clanApplication.findMany({
      where: {
        clanId: clan.id
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      applications: applications.map(app => ({
        id: app.id,
        inGameName: app.inGameName,
        accountTag: app.accountTag,
        status: app.status,
        createdAt: app.createdAt.toISOString(),
        user: app.user
      }))
    })
  } catch (error) {
    console.error('Error fetching clan applications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clan applications' },
      { status: 500 }
    )
  }
}