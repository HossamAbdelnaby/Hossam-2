import { NextRequest, NextResponse } from 'next/server'
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

    // Get application statistics
    const applications = await db.clanApplication.findMany({
      where: {
        clanId: id
      }
    })

    const stats = {
      totalApplications: applications.length,
      approvedApplications: applications.filter(app => app.status === 'approved').length,
      pendingApplications: applications.filter(app => app.status === 'pending').length,
      rejectedApplications: applications.filter(app => app.status === 'rejected').length
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Error fetching clan stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clan statistics' },
      { status: 500 }
    )
  }
}