import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Check if clan exists
    const clan = await db.clan.findUnique({
      where: {
        id: id,
        isActive: true
      }
    })

    if (!clan) {
      return NextResponse.json({ error: 'Clan not found' }, { status: 404 })
    }

    // Get all applications for this clan
    const applications = await db.clanApplication.findMany({
      where: {
        clanId: id
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
        name: app.name,
        playerTag: app.playerTag,
        paymentMethod: app.paymentMethod,
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