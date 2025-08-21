import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function PUT(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    
    const { language, emailNotifications, pushNotifications } = await request.json()

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Update user settings
    const updatedUser = await db.user.update({
      where: { id: decoded.userId },
      data: {
        language: language || user.language
      }
    })

    // Here you would typically save notification preferences to a separate table
    // For now, we'll just acknowledge the settings update

    return NextResponse.json({
      message: 'Settings updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        name: updatedUser.name,
        language: updatedUser.language,
        emailNotifications,
        pushNotifications
      }
    })

  } catch (error) {
    console.error('Settings update error:', error)
    
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}