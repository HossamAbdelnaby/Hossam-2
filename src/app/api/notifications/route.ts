import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getToken } from 'next-auth/jwt'

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request })
    
    if (!token?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where = {
      userId: token.sub,
      ...(unreadOnly && { isRead: false })
    }

    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    const totalCount = await db.notification.count({ where })

    return NextResponse.json({
      notifications,
      totalCount,
      unreadCount: await db.notification.count({
        where: { userId: token.sub, isRead: false }
      })
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request })
    
    if (!token?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, message, type } = await request.json()

    if (!title || !message || !type) {
      return NextResponse.json(
        { error: 'Title, message, and type are required' },
        { status: 400 }
      )
    }

    const notification = await db.notification.create({
      data: {
        title,
        message,
        type,
        userId: token.sub
      }
    })

    // Emit real-time notification via Socket.IO
    const { getIO } = await import('@/lib/socket')
    const io = getIO()
    io.to(`user:${token.sub}`).emit('notification', notification)

    return NextResponse.json(notification)
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}