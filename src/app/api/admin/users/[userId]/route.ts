import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'

export async function PATCH(request: NextRequest, { params }: { params: { userId: string } }) {
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
      case 'ban':
        updateData = { isActive: false }
        break
      case 'unban':
        updateData = { isActive: true }
        break
      case 'promote':
        updateData = { role: 'MODERATOR' }
        break
      case 'demote':
        updateData = { role: 'USER' }
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Prevent admin from demoting themselves
    if (params.userId === token.sub && (action === 'demote' || action === 'ban')) {
      return NextResponse.json({ error: 'Cannot perform this action on yourself' }, { status: 400 })
    }

    const updatedUser = await db.user.update({
      where: { id: params.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    })

    // Emit real-time update via Socket.IO
    const { getIO } = await import('@/lib/socket')
    const io = getIO()
    io.to('admin').emit('user-updated', updatedUser)

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}