import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as jwt from 'jsonwebtoken'

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
    
    const { name, username, email, phone, description, language, avatar } = await request.json()

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if username or email is already taken by another user
    if (username !== existingUser.username) {
      const usernameExists = await db.user.findUnique({
        where: { username }
      })
      if (usernameExists) {
        return NextResponse.json(
          { error: 'Username already taken' },
          { status: 400 }
        )
      }
    }

    if (email !== existingUser.email) {
      const emailExists = await db.user.findUnique({
        where: { email }
      })
      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already taken' },
          { status: 400 }
        )
      }
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { id: decoded.userId },
      data: {
        name: name || null,
        username,
        email,
        phone: phone || null,
        description: description || null,
        language,
        avatar: avatar || null
      }
    })

    // Return updated user data (excluding password)
    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        name: updatedUser.name,
        phone: updatedUser.phone,
        description: updatedUser.description,
        role: updatedUser.role,
        language: updatedUser.language,
        avatar: updatedUser.avatar
      }
    })

  } catch (error) {
    console.error('Profile update error:', error)
    
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