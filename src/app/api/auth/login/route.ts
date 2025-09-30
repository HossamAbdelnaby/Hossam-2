import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken'
import { db } from '@/lib/db'
import { logAuthActivity, getClientIP, getUserAgent } from '@/lib/activity-logger'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email }
    })

    if (!user) {
      // Log failed login attempt
      await logAuthActivity(
        'Failed Login',
        'Login attempt with non-existent email',
        { id: 'unknown', email, username: 'unknown', name: 'Unknown', role: 'UNKNOWN' },
        'error',
        getClientIP(request),
        getUserAgent(request)
      );
      
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      // Log failed login attempt
      await logAuthActivity(
        'Failed Login',
        'Login attempt with incorrect password',
        user,
        'error',
        getClientIP(request),
        getUserAgent(request)
      );
      
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Log successful login
    await logAuthActivity(
      'Login',
      'User successfully logged in to the system',
      user,
      'success',
      getClientIP(request),
      getUserAgent(request)
    );

    // Create response with user data (excluding password)
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        phone: user.phone,
        role: user.role,
        language: user.language
      },
      token
    })

    // Set HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}