import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { db } from '@/lib/db'
import { ServiceType, ServiceStatus } from '@prisma/client'

export async function POST(request: NextRequest) {
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
      title,
      description,
      type,
      price,
      duration,
      requirements,
      deliveryMethod,
    } = body

    // Validate required fields
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Service title is required' },
        { status: 400 }
      )
    }

    if (!description || !description.trim()) {
      return NextResponse.json(
        { error: 'Service description is required' },
        { status: 400 }
      )
    }

    if (!type || !Object.values(ServiceType).includes(type as ServiceType)) {
      return NextResponse.json(
        { error: 'Valid service type is required' },
        { status: 400 }
      )
    }

    if (!price || price <= 0) {
      return NextResponse.json(
        { error: 'Valid price is required' },
        { status: 400 }
      )
    }

    if (!duration || !duration.trim()) {
      return NextResponse.json(
        { error: 'Duration is required' },
        { status: 400 }
      )
    }

    // Create service
    const service = await db.service.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        type: type as ServiceType,
        price,
        duration: duration.trim(),
        requirements: requirements?.trim() || null,
        deliveryMethod: deliveryMethod?.trim() || null,
        status: ServiceStatus.AVAILABLE,
        providerId: decoded.userId,
      },
      include: {
        provider: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({
      message: 'Service created successfully',
      service,
    })
  } catch (error) {
    console.error('Service creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create service' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const type = searchParams.get('type')
    const priceRange = searchParams.get('priceRange')
    const sortBy = searchParams.get('sortBy') || 'newest'

    const skip = (page - 1) * limit

    const where: any = {
      isActive: true,
      status: ServiceStatus.AVAILABLE,
    }

    if (type && Object.values(ServiceType).includes(type as ServiceType)) {
      where.type = type
    }

    if (priceRange && priceRange !== 'all') {
      if (priceRange === '0-25') {
        where.price = {
          gte: 0,
          lte: 25,
        }
      } else if (priceRange === '25-50') {
        where.price = {
          gte: 25,
          lte: 50,
        }
      } else if (priceRange === '50-100') {
        where.price = {
          gte: 50,
          lte: 100,
        }
      } else if (priceRange === '100+') {
        where.price = {
          gte: 100,
        }
      }
    }

    let orderBy: any = {}
    switch (sortBy) {
      case 'newest':
        orderBy = { createdAt: 'desc' }
        break
      case 'price-low':
        orderBy = { price: 'asc' }
        break
      case 'price-high':
        orderBy = { price: 'desc' }
        break
      case 'rating':
        orderBy = { rating: 'desc' }
        break
      default:
        orderBy = { createdAt: 'desc' }
    }

    const [services, total] = await Promise.all([
      db.service.findMany({
        where,
        include: {
          provider: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          _count: {
            select: {
              reviews: {
                where: {
                  isActive: true,
                },
              },
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      db.service.count({ where }),
    ])

    // Calculate average ratings for each service
    const servicesWithRatings = await Promise.all(
      services.map(async (service) => {
        const reviews = await db.review.findMany({
          where: {
            serviceId: service.id,
            isActive: true,
          },
        })

        const avgRating = reviews.length > 0
          ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
          : 0

        return {
          ...service,
          rating: avgRating,
          reviewCount: reviews.length,
        }
      })
    )

    return NextResponse.json({
      services: servicesWithRatings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Services fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    )
  }
}