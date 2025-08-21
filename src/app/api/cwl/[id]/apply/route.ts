import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const {
      inGameName,
      accountTag,
      agreeToTerms,
    } = body

    // Validate required fields
    if (!inGameName || !inGameName.trim()) {
      return NextResponse.json(
        { error: 'In-game name is required' },
        { status: 400 }
      )
    }

    if (!accountTag || !accountTag.trim()) {
      return NextResponse.json(
        { error: 'Account tag is required' },
        { status: 400 }
      )
    }

    if (!agreeToTerms) {
      return NextResponse.json(
        { error: 'You must agree to the terms and conditions' },
        { status: 400 }
      )
    }

    // Check if clan exists and is active
    const clan = await db.clan.findUnique({
      where: { id: params.id },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    if (!clan || !clan.isActive) {
      return NextResponse.json(
        { error: 'Clan not found or is no longer active' },
        { status: 404 }
      )
    }

    // Check if user already has a pending application for this clan
    const existingApplication = await db.clanApplication.findFirst({
      where: {
        clanId: params.id,
        userId: decoded.userId,
        status: 'PENDING'
      }
    })

    if (existingApplication) {
      return NextResponse.json(
        { error: 'You already have a pending application for this clan' },
        { status: 400 }
      )
    }

    // Check if user is already a member of this clan
    const existingMembership = await db.clanMember.findFirst({
      where: {
        clanId: params.id,
        userId: decoded.userId
      }
    })

    if (existingMembership) {
      return NextResponse.json(
        { error: 'You are already a member of this clan' },
        { status: 400 }
      )
    }

    // Create clan application
    const application = await db.clanApplication.create({
      data: {
        name: inGameName.trim(),
        playerTag: accountTag.trim(),
        paymentMethod: 'PENDING', // Will be determined by clan owner
        status: 'PENDING',
        clanId: params.id,
        userId: decoded.userId,
      },
      include: {
        clan: {
          select: {
            id: true,
            name: true,
            tag: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({
      message: 'Application submitted successfully',
      application,
    })
  } catch (error) {
    console.error('CWL clan application error:', error)
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check if clan exists and is active
    const clan = await db.clan.findUnique({
      where: { id: params.id },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    if (!clan || !clan.isActive) {
      return NextResponse.json(
        { error: 'Clan not found or is no longer active' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      clan,
    })
  } catch (error) {
    console.error('CWL clan fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clan details' },
      { status: 500 }
    )
  }
}