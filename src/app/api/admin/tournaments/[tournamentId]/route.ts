import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'

export async function PATCH(request: NextRequest, { params }: { params: { tournamentId: string } }) {
  try {
    const token = await getToken({ req: request })
    
    if (!token?.sub || token.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action } = await request.json()

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 })
    }

    let updateData = {}

    switch (action) {
      case 'cancel':
        updateData = { status: 'CANCELLED' }
        break
      case 'complete':
        updateData = { status: 'COMPLETED', endDate: new Date() }
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
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