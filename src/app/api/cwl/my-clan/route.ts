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
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    })

    if (!clan) {
      return NextResponse.json({ error: 'Clan not found' }, { status: 404 })
    }

    return NextResponse.json({
      clan: {
        id: clan.id,
        name: clan.name,
        tag: clan.tag,
        leagueLevel: clan.leagueLevel,
        membersNeeded: clan.membersNeeded,
        offeredPayment: clan.offeredPayment,
        terms: clan.terms,
        isActive: clan.isActive,
        createdAt: clan.createdAt.toISOString(),
        updatedAt: clan.updatedAt.toISOString(),
        owner: clan.owner
      }
    })
  } catch (error) {
    console.error('Error fetching clan details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clan details' },
      { status: 500 }
    )
  }
}