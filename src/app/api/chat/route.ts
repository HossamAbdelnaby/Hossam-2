import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request })
    
    if (!token?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (userId) {
      // Get conversation with specific user
      const messages = await db.message.findMany({
        where: {
          OR: [
            { senderId: token.sub, receiverId: userId },
            { senderId: userId, receiverId: token.sub }
          ]
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          },
          receiver: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      })

      return NextResponse.json(messages)
    } else {
      // Get all conversations for the current user
      const conversations = await db.message.findMany({
        where: {
          OR: [
            { senderId: token.sub },
            { receiverId: token.sub }
          ]
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          },
          receiver: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      // Group by conversation partner and get last message
      const conversationMap = new Map()
      conversations.forEach(message => {
        const partnerId = message.senderId === token.sub ? message.receiverId : message.senderId
        const partner = message.senderId === token.sub ? message.receiver : message.sender
        
        if (!conversationMap.has(partnerId)) {
          conversationMap.set(partnerId, {
            partner,
            lastMessage: message,
            unreadCount: message.receiverId === token.sub && !message.readAt ? 1 : 0
          })
        } else {
          const conv = conversationMap.get(partnerId)
          if (message.receiverId === token.sub && !message.readAt) {
            conv.unreadCount += 1
          }
        }
      })

      return NextResponse.json(Array.from(conversationMap.values()))
    }
  } catch (error) {
    console.error('Error fetching chat messages:', error)
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

    const { receiverId, content } = await request.json()

    if (!receiverId || !content?.trim()) {
      return NextResponse.json(
        { error: 'Receiver ID and content are required' },
        { status: 400 }
      )
    }

    // Create message
    const message = await db.message.create({
      data: {
        senderId: token.sub,
        receiverId,
        content: content.trim()
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    })

    // Emit real-time message via Socket.IO
    const { getIO } = await import('@/lib/socket')
    const io = getIO()
    
    // Send to both sender and receiver
    io.to(`user:${token.sub}`).emit('new-message', message)
    io.to(`user:${receiverId}`).emit('new-message', message)

    // Send notification to receiver
    const { notifications } = await import('@/lib/notifications/send-notification')
    await notifications.newMessage(receiverId, message.sender.name || message.sender.email)

    return NextResponse.json(message)
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}