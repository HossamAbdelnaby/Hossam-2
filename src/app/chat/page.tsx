'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/auth-context'
import { ChatInterface } from '@/components/chat/chat-interface'
import { Search, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Conversation {
  partner: {
    id: string
    name?: string
    email: string
    avatar?: string
  }
  lastMessage: {
    id: string
    content: string
    createdAt: string
    readAt?: string
  }
  unreadCount: number
}

interface User {
  id: string
  name?: string
  email: string
  avatar?: string
}

export default function ChatPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchConversations()
    }
  }, [user])

  const fetchConversations = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/chat')
      if (response.ok) {
        const data = await response.json()
        setConversations(data)
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredConversations = conversations.filter(conv => {
    const searchLower = searchTerm.toLowerCase()
    const partnerName = conv.partner.name?.toLowerCase() || ''
    const partnerEmail = conv.partner.email.toLowerCase()
    return partnerName.includes(searchLower) || partnerEmail.includes(searchLower)
  })

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-center">
          <div className="w-8 h-8 bg-muted rounded-full mx-auto mb-2"></div>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  if (selectedUser) {
    return (
      <div className="container mx-auto p-4 h-screen">
        <div className="max-w-4xl mx-auto h-full">
          <ChatInterface
            currentUser={{
              id: user.id,
              name: user.name || undefined,
              email: user.email,
              avatar: user.avatar || undefined
            }}
            otherUser={selectedUser}
            onBack={() => setSelectedUser(null)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Messages</h1>
            <p className="text-muted-foreground">Chat with other users</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Conversations</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-3">
                        <div className="w-10 h-10 bg-muted rounded-full animate-pulse"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-muted rounded animate-pulse mb-2"></div>
                          <div className="h-3 bg-muted rounded animate-pulse w-3/4"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground mb-2">No conversations found</div>
                    <p className="text-sm text-muted-foreground">
                      {searchTerm ? 'Try a different search term' : 'Start a new conversation to see messages here'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredConversations.map((conversation) => (
                      <button
                        key={conversation.partner.id}
                        onClick={() => setSelectedUser(conversation.partner)}
                        className="w-full text-left p-3 hover:bg-muted rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={conversation.partner.avatar || undefined} alt={conversation.partner.name || conversation.partner.email} />
                            <AvatarFallback>
                              {(conversation.partner.name || conversation.partner.email).charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium truncate">
                                {conversation.partner.name || conversation.partner.email}
                              </h3>
                              {conversation.unreadCount > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {conversation.unreadCount}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {conversation.lastMessage.content}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(conversation.lastMessage.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Empty State */}
          <Card className="lg:col-span-2">
            <CardContent className="flex items-center justify-center h-[600px]">
              <div className="text-center">
                <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                <p className="text-muted-foreground">
                  Choose a conversation from the list to start chatting
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}