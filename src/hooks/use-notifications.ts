'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
}

interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  fetchNotifications: () => Promise<void>
  markAsRead: (notificationIds: string[]) => Promise<void>
  markAllAsRead: () => Promise<void>
  createNotification: (data: { title: string; message: string; type: string }) => Promise<void>
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/notifications?limit=50')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch notifications',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const markAsRead = useCallback(async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds })
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => notificationIds.includes(n.id) ? { ...n, isRead: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - notificationIds.length))
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error)
      toast({
        title: 'Error',
        description: 'Failed to mark notifications as read',
        variant: 'destructive'
      })
    }
  }, [toast])

  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id)
    if (unreadIds.length > 0) {
      await markAsRead(unreadIds)
    }
  }, [notifications, markAsRead])

  const createNotification = useCallback(async (data: { title: string; message: string; type: string }) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        const notification = await response.json()
        setNotifications(prev => [notification, ...prev])
        setUnreadCount(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error creating notification:', error)
      toast({
        title: 'Error',
        description: 'Failed to create notification',
        variant: 'destructive'
      })
    }
  }, [toast])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Setup socket listeners for real-time notifications
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const initSocket = async () => {
        const io = (await import('socket.io-client')).default
        const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000')

        socket.on('notification', (notification: Notification) => {
          setNotifications(prev => [notification, ...prev])
          setUnreadCount(prev => prev + 1)
          toast({
            title: notification.title,
            description: notification.message,
          })
        })

        return () => socket.disconnect()
      }
      
      initSocket()
    }
  }, [toast])

  return {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    createNotification
  }
}