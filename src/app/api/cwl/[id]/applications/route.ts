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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Try to get session - add error handling
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError) {
      console.error('Session error:', sessionError)
      return NextResponse.json({ error: 'Session error' }, { status: 401 })
    }
    
    if (!session?.user?.id) {
      console.log('No session or user ID found')
      return NextResponse.json({ error: 'Unauthorized - No session' }, { status: 401 })
    }

    const body = await request.json()
    const { requestId, action } = body

    console.log('PATCH request:', { id, requestId, action, userId: session.user.id })

    if (!requestId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 })
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
      console.log('Clan not found or access denied for user:', session.user.id)
      return NextResponse.json({ error: 'Clan not found or access denied' }, { status: 404 })
    }

    console.log('Clan found:', clan.name)

    // Find the application
    const application = await db.clanApplication.findFirst({
      where: {
        id: requestId,
        clanId: id,
        status: {
          in: ['pending', 'PENDING']
        }
      }
    })

    if (!application) {
      console.log('Application not found:', { requestId, clanId: id })
      return NextResponse.json({ error: 'Application not found or already processed' }, { status: 404 })
    }

    console.log('Application found:', application.name)

    // Update the application status
    const newStatus = action === 'approve' ? 'ACCEPTED' : 'REJECTED'
    console.log('Updating status to:', newStatus)
    
    const updatedApplication = await db.clanApplication.update({
      where: {
        id: requestId
      },
      data: {
        status: newStatus
      }
    })

    console.log('Application updated successfully')

    return NextResponse.json({
      message: `Application ${action}d successfully`,
      application: {
        id: updatedApplication.id,
        status: updatedApplication.status
      }
    })
  } catch (error) {
    console.error('Error in PATCH /api/cwl/[id]/applications:', error)
    return NextResponse.json(
      { error: 'Failed to update application: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}