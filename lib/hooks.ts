"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { petsAPI, productsAPI, servicesAPI, ordersAPI, bookingsAPI, packagesAPI, merchantAPI, aiAPI } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

// ==================== Generic Fetch Hook ====================
interface UseFetchResult<T> {
  data: T | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

function useFetch<T>(
  fetchFn: () => Promise<{ success: boolean; data?: T; message?: string }>,
  deps: any[] = []
): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetchFn()
      if (response.success) {
        setData(response.data || null)
      } else {
        setError(response.message || "Failed to fetch data")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsLoading(false)
    }
  }, deps)

  useEffect(() => {
    refetch()
  }, [refetch])

  return { data, isLoading, error, refetch }
}

// ==================== Pets Hooks ====================
export function usePets() {
  return useFetch<any[]>(() => petsAPI.list())
}

export function usePet(id: string) {
  return useFetch<any>(() => petsAPI.get(id), [id])
}

export function useMedicalRecords(petId: string) {
  return useFetch<any[]>(() => petsAPI.getMedicalRecords(petId), [petId])
}

export function usePendingMedicalRecords(petId: string) {
  return useFetch<any[]>(() => petsAPI.getMedicalRecordsPending(petId), [petId])
}

// ==================== Products Hooks ====================
export function useProducts(params?: {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  targetSpecies?: string;
  lifeStage?: string;
  breedSize?: string;
  healthTags?: string[];
  isSterilized?: boolean;
}) {
  return useFetch<{ products: any[]; pagination: any }>(
    () => productsAPI.list(params),
    [
      params?.category,
      params?.search,
      params?.page,
      params?.limit,
      params?.targetSpecies,
      params?.lifeStage,
      params?.breedSize,
      params?.healthTags?.join(","),
      params?.isSterilized,
    ]
  )
}

// ==================== Services Hooks ====================
export function useServices() {
  return useFetch<{ services: any[]; pagination: any }>(() => servicesAPI.list())
}

// ==================== Orders Hooks ====================
export function useOrders() {
  return useFetch<any[]>(() => ordersAPI.list())
}

// ==================== Bookings Hooks ====================
export function useBookings() {
  return useFetch<any[]>(() => bookingsAPI.list())
}

// ==================== Dashboard Data Hook ====================
export function useDashboardData() {
  const [data, setData] = useState<{
    pets: any[] | null
    bookings: any[] | null
    orders: any[] | null
  }>({ pets: null, bookings: null, orders: null })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [petsRes, bookingsRes, ordersRes] = await Promise.all([
        petsAPI.list(),
        bookingsAPI.list(),
        ordersAPI.list(),
      ])

      setData({
        pets: petsRes.success ? petsRes.data || [] : [],
        bookings: bookingsRes.success ? bookingsRes.data || [] : [],
        orders: ordersRes.success ? ordersRes.data || [] : [],
      })

      const errors = [
        !petsRes.success ? petsRes.message : null,
        !bookingsRes.success ? bookingsRes.message : null,
        !ordersRes.success ? ordersRes.message : null,
      ].filter(Boolean)

      if (errors.length > 0) setError(errors.join(", "))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { ...data, isLoading, error, refetch }
}

// ==================== Packages Hooks ====================
export function useCustomerPackages() {
  return useFetch<any[]>(() => packagesAPI.listCustomer())
}

export function useMerchantPackages() {
  return useFetch<any[]>(() => packagesAPI.listMerchant())
}

// ==================== Merchant Hooks ====================
export function useMerchantProducts() {
  return useFetch<any[]>(() => merchantAPI.listProducts())
}

export function useMerchantServices() {
  return useFetch<any[]>(() => merchantAPI.listServices())
}

export function useMerchantMedicalRecords(params?: { status?: string; pet_id?: string }) {
  return useFetch<any>(() => merchantAPI.getMedicalRecords(params), [params?.status, params?.pet_id])
}

export function useMerchantCompletedBookings() {
  return useFetch<any>(() => merchantAPI.getCompletedBookings())
}

export function useMerchantAnalytics(range: string = "7d", from?: string, to?: string) {
  return useFetch<any>(() => merchantAPI.getAnalytics(range, from, to), [range, from, to])
}

// ==================== AI Hooks ====================
export function useAIRecommendProducts(petId: string | null) {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRecommendations = useCallback(async () => {
    if (!petId) return
    setIsLoading(true)
    setError(null)
    try {
      const response = await aiAPI.recommendProducts(petId)
      if (response.success) setData(response.data)
      else setError(response.message || "Failed to get recommendations")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsLoading(false)
    }
  }, [petId])

  return { data, isLoading, error, fetchRecommendations }
}

export function useAIConsultation() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)

  const consult = useCallback(async (petId: string, symptoms: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await aiAPI.consultation(petId, symptoms)
      if (response.success) {
        setResult(response.data)
        return response.data
      } else {
        setError(response.message || "Consultation failed")
        return null
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { consult, isLoading, error, result }
}

// ==================== Manager Hooks ====================
export function useManagerStats(startDate?: string, endDate?: string) {
  return useFetch<any>(
    () => import("@/lib/api").then((m) => m.managerAPI.getRevenueStats(startDate, endDate)),
    [startDate, endDate]
  )
}

export function useManagerMerchants(params?: { status?: string; page?: number }) {
  return useFetch<{ merchants: any[]; pagination: any }>(
    () => import("@/lib/api").then((m) => m.managerAPI.listMerchants(params)),
    [params?.status, params?.page]
  )
}

export function usePackages() {
  return useFetch<any[]>(() => import("@/lib/api").then((m) => m.packagesAPI.listAll()))
}

export function useManagerSubscriptions(params?: { page?: number; limit?: number }) {
  return useFetch<{ subscriptions: any[]; pagination: any }>(
    () => import("@/lib/api").then((m) => m.managerAPI.listSubscriptions(params)),
    [params?.page, params?.limit]
  )
}

// ==================== Admin Hooks ====================
export function useAdminUsers(params?: { role?: string; status?: string; search?: string; page?: number; limit?: number }) {
  return useFetch<{ users: any[]; stats: any; pagination: any }>(
    () => import("@/lib/api").then((m) => m.adminAPI.listUsers(params)),
    [params?.role, params?.status, params?.search, params?.page, params?.limit]
  )
}

// ==================== Banners Hooks ====================
export function useBanners(location?: string) {
  return useFetch<{ banners: any[] }>(
    () => import("@/lib/api").then((m) => m.bannersAPI.list(location)),
    [location]
  )
}

export function useManagerBanners() {
  return useFetch<{ banners: any[] }>(() => import("@/lib/api").then((m) => m.bannersAPI.list()), [])
}

// ==================== Notification Hooks ====================
export interface Notification {
  _id: string
  id?: string
  type: "ORDER_UPDATE" | "BOOKING_UPDATE" | "MEDICAL_RECORD" | "SUBSCRIPTION" | "SYSTEM"
  title: string
  message: string
  is_read: boolean
  isRead?: boolean
  redirect_url?: string
  redirectTab?: string
  reference_id?: string
  created_at: string
  createdAt?: Date
}

export function useNotifications() {
  const { user } = useAuth()
  const userId = user?.id
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    try {
      const { notificationsAPI } = await import("@/lib/api")
      const response = await notificationsAPI.list({ limit: 20 })
      if (response.success && response.data) {
        const transformed = response.data.notifications.map((n: any) => ({
          ...n,
          id: n._id,
          isRead: n.is_read,
          createdAt: new Date(n.created_at),
          redirectTab: n.redirect_url?.includes("tab=")
            ? n.redirect_url.split("tab=")[1]?.split("&")[0]
            : undefined,
        }))
        setNotifications(transformed)
        setUnreadCount(response.data.unreadCount || 0)
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Pusher real-time listener
  useEffect(() => {
    if (!userId) return

    const { pusherClient } = require("@/lib/pusher")
    if (!pusherClient) return

    const channel = pusherClient.subscribe(`user-${userId}`)
    
    channel.bind("notification", (data: any) => {
      const newNotification = {
        ...data,
        id: data.id || data._id,
        isRead: false,
        createdAt: new Date(data.created_at || Date.now()),
      }
      
      setNotifications(prev => [newNotification, ...prev.slice(0, 19)])
      setUnreadCount(prev => prev + 1)
      
      // Optional: show toast for new social notification
      import("sonner").then(({ toast }) => {
        toast.info(data.title, {
          description: data.message,
          action: data.redirect_url ? {
            label: "Xem",
            onClick: () => window.location.href = data.redirect_url
          } : undefined
        })
      })
    })

    return () => {
      pusherClient.unsubscribe(`user-${userId}`)
    }
  }, [userId])

  const markAsRead = useCallback(async (id: string) => {
    try {
      const { notificationsAPI } = await import("@/lib/api")
      await notificationsAPI.markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n._id === id || n.id === id ? { ...n, is_read: true, isRead: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      const { notificationsAPI } = await import("@/lib/api")
      await notificationsAPI.markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true, isRead: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error)
    }
  }, [])

  return { notifications, unreadCount, markAsRead, markAllAsRead, isLoading, refetch: fetchNotifications }
}

// ==================== Infinite Scroll Hook ====================
export function useInView({ onInView }: { onInView: () => void }) {
  const onInViewRef = useRef(onInView)
  const observerRef = useRef<IntersectionObserver | null>(null)
  onInViewRef.current = onInView

  const ref = useCallback((el: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }
    if (el) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) onInViewRef.current()
        },
        { threshold: 0.1 }
      )
      observer.observe(el)
      observerRef.current = observer
    }
  }, [])

  return { ref }
}

// ==================== Social Network Hooks ====================
export function useSocialFeed(userId?: string) {
  const [posts, setPosts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [cursor, setCursor] = useState<string | null>(null)
  const isFetchingRef = useRef(false)

  const fetchInitial = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { socialAPI } = await import("@/lib/api")
      const res = await socialAPI.getFeed({ limit: 10, user_id: userId })
      if (res.success && res.data) {
        setPosts(res.data.posts || [])
        setHasMore(res.data.pagination?.has_more ?? false)
        setCursor(res.data.pagination?.next_cursor ?? null)
      } else {
        setError(res.message || "Failed to load feed")
      }
    } catch (err) {
      setError("Failed to load feed")
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  const fetchMore = useCallback(async () => {
    if (!hasMore || !cursor || isFetchingRef.current) return
    isFetchingRef.current = true
    setIsFetchingMore(true)
    try {
      const { socialAPI } = await import("@/lib/api")
      const res = await socialAPI.getFeed({ cursor, limit: 10, user_id: userId })
      if (res.success && res.data) {
        setPosts((prev) => [...prev, ...(res.data.posts || [])])
        setHasMore(res.data.pagination?.has_more ?? false)
        setCursor(res.data.pagination?.next_cursor ?? null)
      }
    } catch (err) {
      /* silent */
    } finally {
      isFetchingRef.current = false
      setIsFetchingMore(false)
    }
  }, [hasMore, cursor, userId])

  useEffect(() => {
    fetchInitial()
  }, [fetchInitial])

  return { posts, setPosts, isLoading, isFetchingMore, error, hasMore, fetchMore, refetch: fetchInitial }
}

export function useSocialPost(id: string) {
  return useFetch<any>(() => import("@/lib/api").then((m) => m.socialAPI.getPost(id)), [id])
}

export function useComments(postId: string) {
  const [comments, setComments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [cursor, setCursor] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchInitial = useCallback(async () => {
    if (!postId) return
    setIsLoading(true)
    setError(null)
    try {
      const { socialAPI } = await import("@/lib/api")
      const res = await socialAPI.getComments(postId, { limit: 20 })
      if (res.success && res.data) {
        setComments(res.data.comments || [])
        setHasMore(res.data.pagination?.has_more ?? false)
        setCursor(res.data.pagination?.next_cursor ?? null)
      } else {
        setError(res.message || "Failed to load comments")
      }
    } catch (err) {
      setError("Failed to load comments")
    } finally {
      setIsLoading(false)
    }
  }, [postId])

  const fetchMore = useCallback(async () => {
    if (!hasMore || !cursor || isFetchingMore) return
    setIsFetchingMore(true)
    try {
      const { socialAPI } = await import("@/lib/api")
      const res = await socialAPI.getComments(postId, { cursor, limit: 20 })
      if (res.success && res.data) {
        setComments((prev) => [...prev, ...(res.data.comments || [])])
        setHasMore(res.data.pagination?.has_more ?? false)
        setCursor(res.data.pagination?.next_cursor ?? null)
      }
    } catch (err) {
      /* silent */
    } finally {
      setIsFetchingMore(false)
    }
  }, [hasMore, cursor, isFetchingMore, postId])

  useEffect(() => {
    fetchInitial()
  }, [fetchInitial])

  return { comments, setComments, isLoading, isFetchingMore, hasMore, fetchMore, error, refetch: fetchInitial }
}

export function useReplies(commentId: string) {
  const [replies, setReplies] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [cursor, setCursor] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!commentId) return
    setIsLoading(true)
    try {
      const { socialAPI } = await import("@/lib/api")
      const res = await socialAPI.getReplies(commentId, { limit: 10 })
      if (res.success && res.data) {
        setReplies(res.data.replies || [])
        setHasMore(res.data.pagination?.has_more ?? false)
        setCursor(res.data.pagination?.next_cursor ?? null)
      }
    } catch (err) {
      /* silent */
    } finally {
      setIsLoading(false)
    }
  }, [commentId])

  const fetchMore = useCallback(async () => {
    if (!hasMore || !cursor) return
    try {
      const { socialAPI } = await import("@/lib/api")
      const res = await socialAPI.getReplies(commentId, { cursor, limit: 10 })
      if (res.success && res.data) {
        setReplies((prev) => [...prev, ...(res.data.replies || [])])
        setHasMore(res.data.pagination?.has_more ?? false)
        setCursor(res.data.pagination?.next_cursor ?? null)
      }
    } catch (err) {
      /* silent */
    }
  }, [hasMore, cursor, commentId])

  return { replies, setReplies, isLoading, hasMore, fetchMore, load }
}

export function useFriends(userId?: string) {
  return useFetch<any>(
    () => import("@/lib/api").then((m) => m.socialAPI.getFriends(userId ? { user_id: userId } : {})),
    [userId]
  )
}

export function useFriendRequests(type: "received" | "sent" = "received") {
  return useFetch<any>(() => import("@/lib/api").then((m) => m.socialAPI.getFriendRequests(type)), [type])
}

export function useFriendSuggestions(limit = 10) {
  return useFetch<any>(() => import("@/lib/api").then((m) => m.socialAPI.getFriendSuggestions(limit)), [limit])
}

export function useProfile(userId: string) {
  return useFetch<any>(() => import("@/lib/api").then((m) => m.socialAPI.getProfile(userId)), [userId])
}
