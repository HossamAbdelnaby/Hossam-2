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

export async function PATCH(request: NextRequest, { params }: { params: { tournamentId: string } }) {
  try {
    const user = await getUserFromRequest(request)
    
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, status, ...updateData } = body

    if (status) {
      // Update tournament status
      const validStatuses = ['DRAFT', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'IN_PROGRESS', 'COMPLETED']
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
      
      updateData.status = status
    } else if (action) {
      // Handle specific actions
      switch (action) {
        case 'cancel':
          updateData.status = 'CANCELLED'
          break
        case 'complete':
          updateData.status = 'COMPLETED'
          updateData.endDate = new Date()
          break
        default:
          return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
      }
    }

    const updatedTournament = await db.tournament.update({
      where: { id: params.tournamentId },
      data: updateData,
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

    // Emit real-time update via Socket.IO
    const { getIO } = await import('@/lib/socket')
    const io = getIO()
    io.to(`tournament:${params.tournamentId}`).emit('tournament-updated', updatedTournament)
    io.to('admin').emit('tournament-updated', updatedTournament)

    return NextResponse.json({ tournament: updatedTournament })
  } catch (error) {
    console.error('Error updating tournament:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { tournamentId: string } }) {
  try {
    const user = await getUserFromRequest(request)
    
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if tournament exists
    const tournament = await db.tournament.findUnique({
      where: { id: params.tournamentId },
      include: {
        _count: {
          select: {
            teams: true,
            stages: true
          }
        }
      }
    })

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    // Don't allow deletion if tournament has teams or is in progress
    if (tournament._count.teams > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete tournament with registered teams. Remove teams first.' 
      }, { status: 400 })
    }

    if (tournament.status === 'IN_PROGRESS') {
      return NextResponse.json({ 
        error: 'Cannot delete tournament in progress. Complete or cancel it first.' 
      }, { status: 400 })
    }

    // Delete the tournament
    await db.tournament.delete({
      where: { id: params.tournamentId }
    })

    // Emit real-time update via Socket.IO
    const { getIO } = await import('@/lib/socket')
    const io = getIO()
    io.to('admin').emit('tournament-deleted', { tournamentId: params.tournamentId })

    return NextResponse.json({ 
      message: 'Tournament deleted successfully',
      tournamentId: params.tournamentId
    })
  } catch (error) {
    console.error('Error deleting tournament:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}