'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Send, MoreVertical, Phone, Video } from 'lucide-react'

interface Message {
  id: string
  content: string
  createdAt: string
  readAt?: string
  sender: {
    id: string
    name?: string
    email: string
    avatar?: string
  }
  receiver: {
    id: string
    name?: string
    email: string
    avatar?: string
  }
}

interface User {
  id: string
  name?: string
  email: string
  avatar?: string
}

interface ChatInterfaceProps {
  currentUser: User
  otherUser: User
  onBack?: () => void
}

export function ChatInterface({ currentUser, otherUser, onBack }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const { toast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchMessages()
    setupSocketListeners()
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [otherUser.id])

  const fetchMessages = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/chat?userId=${otherUser.id}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
        
        // Mark messages as read
        const unreadIds = data
          .filter((msg: Message) => msg.receiver.id === currentUser.id && !msg.readAt)
          .map((msg: Message) => msg.id)
        
        if (unreadIds.length > 0) {
          await fetch('/api/chat/mark-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messageIds: unreadIds })
          })
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const setupSocketListeners = () => {
    if (typeof window !== 'undefined') {
      const initSocket = async () => {
        const io = (await import('socket.io-client')).default
        const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000')

        socket.on('new-message', (message: Message) => {
          if (
            (message.sender.id === otherUser.id && message.receiver.id === currentUser.id) ||
            (message.sender.id === currentUser.id && message.receiver.id === otherUser.id)
          ) {
            setMessages(prev => [...prev, message])
            
            // Mark as read if it's a received message
            if (message.receiver.id === currentUser.id) {
              fetch('/api/chat/mark-read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messageIds: [message.id] })
              })
            }
          }
        })

        return () => socket.disconnect()
      }
      
      initSocket()
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isSending) return

    setIsSending(true)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: otherUser.id,
          content: newMessage.trim()
        })
      })

      if (response.ok) {
        setNewMessage('')
      } else {
        throw new Error('Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      })
    } finally {
      setIsSending(false)
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    }
  }

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {}
    
    messages.forEach(message => {
      const date = new Date(message.createdAt).toDateString()
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(message)
    })

    return groups
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-center">
          <div className="w-8 h-8 bg-muted rounded-full mx-auto mb-2"></div>
          <div className="text-sm text-muted-foreground">Loading messages...</div>
        </div>
      </div>
    )
  }

  const messageGroups = groupMessagesByDate(messages)

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <Card className="border-b rounded-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {onBack && (
                <Button variant="ghost" size="sm" onClick={onBack}>
                  ←
                </Button>
              )}
              <Avatar className="w-10 h-10">
                <AvatarImage src={otherUser.avatar || undefined} alt={otherUser.name || otherUser.email} />
                <AvatarFallback>
                  {(otherUser.name || otherUser.email).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">
                  {otherUser.name || otherUser.email}
                </CardTitle>
                <p className="text-sm text-muted-foreground">Online</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm">
                <Phone className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Video className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4">
          {Object.entries(messageGroups).map(([date, dateMessages]) => (
            <div key={date}>
              <div className="text-center my-4">
                <Badge variant="secondary" className="text-xs">
                  {formatDate(date)}
                </Badge>
              </div>
              {dateMessages.map((message) => {
                const isSender = message.sender.id === currentUser.id
                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 mb-4 ${
                      isSender ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {!isSender && (
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage src={message.sender.avatar || undefined} alt={message.sender.name || message.sender.email} />
                        <AvatarFallback className="text-xs">
                          {(message.sender.name || message.sender.email).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        isSender
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isSender ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}
                      >
                        {formatTime(message.createdAt)}
                      </p>
                    </div>
                    {isSender && (
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage src={message.sender.avatar || undefined} alt={message.sender.name || message.sender.email} />
                        <AvatarFallback className="text-xs">
                          {(message.sender.name || message.sender.email).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </ScrollArea>
      </div>

      {/* Message Input */}
      <Card className="border-t rounded-none">
        <CardContent className="p-3">
          <form onSubmit={sendMessage} className="flex gap-2">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={isSending}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage(e)
                }
              }}
            />
            <Button type="submit" disabled={isSending || !newMessage.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}