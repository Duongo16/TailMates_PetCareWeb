"use client"

import { useState, useEffect, useCallback } from "react"
import { petsAPI, productsAPI, servicesAPI, ordersAPI, bookingsAPI, packagesAPI, merchantAPI, aiAPI } from "@/lib/api"

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

// ==================== Products Hooks ====================
export function useProducts(params?: {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  // Specifications filters
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

// ==================== Dashboard Parallel Fetch Hook ====================
/**
 * Fetches pets, bookings, and orders in PARALLEL using Promise.all
 * This reduces dashboard load time from T1+T2+T3 to max(T1,T2,T3)
 */
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
      // Parallel fetch using Promise.all - key optimization!
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

      // Collect any errors
      const errors = [
        !petsRes.success ? petsRes.message : null,
        !bookingsRes.success ? bookingsRes.message : null,
        !ordersRes.success ? ordersRes.message : null,
      ].filter(Boolean)

      if (errors.length > 0) {
        setError(errors.join(", "))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return {
    pets: data.pets,
    bookings: data.bookings,
    orders: data.orders,
    isLoading,
    error,
    refetch,
  }
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
      if (response.success) {
        setData(response.data)
      } else {
        setError(response.message || "Failed to get recommendations")
      }
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
    () => import("@/lib/api").then(m => m.managerAPI.getRevenueStats(startDate, endDate)),
    [startDate, endDate]
  )
}

export function useManagerMerchants(params?: { status?: string; page?: number }) {
  return useFetch<{ merchants: any[]; pagination: any }>(
    () => import("@/lib/api").then(m => m.managerAPI.listMerchants(params)),
    [params?.status, params?.page]
  )
}

export function usePackages() {
  return useFetch<any[]>(() => import("@/lib/api").then(m => m.packagesAPI.listAll()))
}

// ==================== Admin Hooks ====================
export function useAdminUsers(params?: { role?: string; status?: string; search?: string; page?: number }) {
  return useFetch<{ users: any[]; stats: any; pagination: any }>(
    () => import("@/lib/api").then(m => m.adminAPI.listUsers(params)),
    [params?.role, params?.status, params?.search, params?.page]
  )
}

// ==================== Banners Hooks ====================
export function useBanners(location?: string) {
  return useFetch<{ banners: any[] }>(
    () => import("@/lib/api").then(m => m.bannersAPI.list(location)),
    [location]
  )
}

export function useManagerBanners() {
  // Fetch all banners for manager (no location filter, includes inactive)
  return useFetch<{ banners: any[] }>(
    () => import("@/lib/api").then(m => m.bannersAPI.list()),
    []
  )
}
