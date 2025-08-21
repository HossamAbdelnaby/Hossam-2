'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/contexts/auth-context'
import { 
  GraduationCap, 
  Target, 
  Palette, 
  Video, 
  Zap, 
  Star,
  Search,
  Filter,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  Loader2,
  Plus
} from 'lucide-react'

interface Service {
  id: string
  title: string
  description: string
  type: string
  price: number
  duration: string
  provider: {
    id: string
    name: string
    email: string
  }
  status: string
  isActive: boolean
  createdAt: string
  rating?: number
  reviewCount?: number
}

const serviceTypes = [
  { value: 'all', label: 'All Services' },
  { value: 'TRAINING', label: 'Training' },
  { value: 'BASE_ANALYSIS', label: 'Base Analysis' },
  { value: 'CUSTOM_DESIGN', label: 'Custom Design' },
  { value: 'VIDEO_EDITING', label: 'Video Editing' },
  { value: 'STRATEGY', label: 'Strategy' },
]

const serviceIcons = {
  TRAINING: GraduationCap,
  BASE_ANALYSIS: Target,
  CUSTOM_DESIGN: Palette,
  VIDEO_EDITING: Video,
  STRATEGY: Zap,
}

const serviceColors = {
  TRAINING: 'bg-blue-500',
  BASE_ANALYSIS: 'bg-green-500',
  CUSTOM_DESIGN: 'bg-purple-500',
  VIDEO_EDITING: 'bg-orange-500',
  STRATEGY: 'bg-red-500',
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [priceFilter, setPriceFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  const { user } = useAuth()

  useEffect(() => {
    fetchServices()
  }, [currentPage, typeFilter, priceFilter, sortBy])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        sortBy,
      })

      if (typeFilter !== 'all') {
        params.append('type', typeFilter)
      }

      if (priceFilter !== 'all') {
        params.append('priceRange', priceFilter)
      }

      const response = await fetch(`/api/services?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch services')
      }

      const data = await response.json()
      setServices(data.services)
      setTotalPages(data.pagination.pages)
    } catch (err) {
      console.error('Failed to fetch services:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredServices = services.filter(service =>
    service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.provider.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'default'
      case 'IN_PROGRESS': return 'secondary'
      case 'COMPLETED': return 'outline'
      case 'CANCELLED': return 'destructive'
      default: return 'secondary'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const renderStars = (rating?: number) => {
    if (!rating) return null
    
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
        {rating > 0 && (
          <span className="text-sm text-muted-foreground ml-1">
            {rating.toFixed(1)}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Extra Services</h1>
          <p className="text-muted-foreground">
            Professional Clash of Clans services to enhance your gameplay
          </p>
        </div>
        
        {user && (
          <Button asChild className="gap-2">
            <Link href="/services/create">
              <Plus className="w-4 h-4" />
              Offer Service
            </Link>
          </Button>
        )}
      </div>

      {/* Service Types Overview */}
      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {serviceTypes.slice(1).map((type) => {
          const Icon = serviceIcons[type.value as keyof typeof serviceIcons]
          const count = services.filter(s => s.type === type.value).length
          
          return (
            <Card key={type.value} className="text-center hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-2">
                <div className={`w-12 h-12 ${serviceColors[type.value as keyof typeof serviceColors]} rounded-full flex items-center justify-center mx-auto mb-2`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-sm">{type.label}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-2xl font-bold text-primary">{count}</p>
                <p className="text-xs text-muted-foreground">Available</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Search and Filters */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search services by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full lg:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Service Type" />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={priceFilter} onValueChange={setPriceFilter}>
                <SelectTrigger className="w-full lg:w-48">
                  <DollarSign className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Price Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="0-25">$0 - $25</SelectItem>
                  <SelectItem value="25-50">$25 - $50</SelectItem>
                  <SelectItem value="50-100">$50 - $100</SelectItem>
                  <SelectItem value="100+">$100+</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full lg:w-48">
                  <Star className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-5/6"></div>
                  <div className="h-8 bg-muted rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Services Grid */}
          {filteredServices.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => {
                const Icon = serviceIcons[service.type as keyof typeof serviceIcons]
                
                return (
                  <Card key={service.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <div className={`w-12 h-12 ${serviceColors[service.type as keyof typeof serviceColors]} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg line-clamp-1">
                            {service.title}
                          </CardTitle>
                          <CardDescription className="text-sm">
                            by {service.provider.name}
                          </CardDescription>
                          <div className="flex items-center gap-1 mt-1">
                            <Badge variant={getStatusColor(service.status)} className="text-xs">
                              {service.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {service.type.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {service.description}
                      </p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">${service.price}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span>{service.duration}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span>Member since {formatDate(service.createdAt)}</span>
                        </div>
                        
                        {service.rating && (
                          <div className="flex items-center gap-2">
                            {renderStars(service.rating)}
                            {service.reviewCount && (
                              <span className="text-sm text-muted-foreground">
                                ({service.reviewCount} reviews)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button className="flex-1" disabled={service.status !== 'AVAILABLE'}>
                          {service.status === 'AVAILABLE' ? 'Book Service' : 'Unavailable'}
                        </Button>
                        
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <GraduationCap className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">No services found</h2>
              <p className="text-muted-foreground mb-6">
                {searchTerm || typeFilter !== 'all' || priceFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'No services are currently available'
                }
              </p>
              
              {user && !searchTerm && typeFilter === 'all' && priceFilter === 'all' && (
                <Button asChild>
                  <Link href="/services/create">
                    <Plus className="w-4 h-4 mr-2" />
                    Offer Service
                  </Link>
                </Button>
              )}
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && filteredServices.length > 0 && (
        <div className="flex justify-center gap-2 mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              )
            })}
          </div>
          
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}