import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const clan = await db.clan.findUnique({
      where: {
        id: id,
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find the clan and verify ownership
    const clan = await db.clan.findFirst({
      where: {
        id: id,
        ownerId: session.user.id,
        isActive: true
      }
    })

    if (!clan) {
      return NextResponse.json({ error: 'Clan not found or access denied' }, { status: 404 })
    }

    // Delete all applications associated with this clan
    await db.clanApplication.deleteMany({
      where: {
        clanId: id
      }
    })

    // Delete the clan
    await db.clan.delete({
      where: {
        id: id
      }
    })

    return NextResponse.json({
      message: 'Clan deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting clan:', error)
    return NextResponse.json(
      { error: 'Failed to delete clan' },
      { status: 500 }
    )
  }
}