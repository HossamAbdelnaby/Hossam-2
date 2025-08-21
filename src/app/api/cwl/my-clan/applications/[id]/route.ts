import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action } = await request.json()

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
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

    // Find the application
    const application = await db.clanApplication.findFirst({
      where: {
        id: params.id,
        clanId: clan.id
      }
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Update the application status
    const updatedApplication = await db.clanApplication.update({
      where: {
        id: application.id
      },
      data: {
        status: action === 'approve' ? 'approved' : 'rejected'
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      application: {
        id: updatedApplication.id,
        inGameName: updatedApplication.inGameName,
        accountTag: updatedApplication.accountTag,
        status: updatedApplication.status,
        createdAt: updatedApplication.createdAt.toISOString(),
        user: updatedApplication.user
      },
      message: `Application ${action}d successfully`
    })
  } catch (error) {
    console.error('Error updating clan application:', error)
    return NextResponse.json(
      { error: 'Failed to update application' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Find the application
    const application = await db.clanApplication.findFirst({
      where: {
        id: params.id,
        clanId: clan.id
      }
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Delete the application
    await db.clanApplication.delete({
      where: {
        id: application.id
      }
    })

    return NextResponse.json({
      message: 'Application deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting clan application:', error)
    return NextResponse.json(
      { error: 'Failed to delete application' },
      { status: 500 }
    )
  }
}