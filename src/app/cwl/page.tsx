'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/contexts/auth-context'
import { 
  Shield, 
  Users, 
  Calendar, 
  Plus,
  Search,
  Crown,
  Settings,
  Loader2
} from 'lucide-react'

interface Clan {
  id: string
  name: string
  tag: string
  leagueLevel?: number
  membersNeeded: number
  offeredPayment: number
  terms?: string
  isActive: boolean
  createdAt: string
  owner: {
    id: string
    email: string
    name?: string
  }
}

export default function CWLPage() {
  const [clans, setClans] = useState<Clan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  const { user } = useAuth()

  useEffect(() => {
    fetchClans()
  }, [currentPage])

  const fetchClans = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
      })

      const response = await fetch(`/api/cwl?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch CWL clans')
      }

      const data = await response.json()
      setClans(data.clans)
      setTotalPages(data.pagination.pages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch CWL clans')
    } finally {
      setLoading(false)
    }
  }

  const filteredClans = clans.filter(clan =>
    clan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    clan.tag.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">CWL Clan Management</h1>
          <p className="text-muted-foreground">
            Register your clan for Clan War Leagues and manage participation
          </p>
        </div>
        
        {user && (
          <Button asChild className="gap-2">
            <Link href="/cwl/register">
              <Plus className="w-4 h-4" />
              Register Clan
            </Link>
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search clans by name or tag..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="mb-8 border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

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
          {/* Clans Grid */}
          {filteredClans.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClans.map((clan) => (
                <Card key={clan.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg line-clamp-2">
                          {clan.name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <Shield className="w-3 h-3" />
                          {clan.tag}
                        </CardDescription>
                        <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                          <span>Owned by {clan.owner.name || clan.owner.email}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className="text-xs">
                          League {clan.leagueLevel || 'N/A'}
                        </Badge>
                        <Badge variant={clan.isActive ? 'default' : 'secondary'} className="text-xs">
                          {clan.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {clan.terms && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {clan.terms}
                      </p>
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{clan.membersNeeded} members needed</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Crown className="w-4 h-4 text-muted-foreground" />
                        <span>${clan.offeredPayment.toFixed(2)} per player</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>Created {formatDate(clan.createdAt)}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button asChild className="flex-1">
                        <Link href={`/cwl/${clan.id}`}>
                          View Details
                        </Link>
                      </Button>
                      
                      {user && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/cwl/${clan.id}/apply`}>
                            Apply
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">No CWL clans found</h2>
              <p className="text-muted-foreground mb-6">
                {searchTerm
                  ? 'Try adjusting your search'
                  : 'Be the first to register your clan for CWL!'
                }
              </p>
              
              {user && !searchTerm && (
                <Button asChild>
                  <Link href="/cwl/register">
                    <Plus className="w-4 h-4 mr-2" />
                    Register Clan
                  </Link>
                </Button>
              )}
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && filteredClans.length > 0 && (
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