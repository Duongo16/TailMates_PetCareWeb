"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { authAPI } from "@/lib/api"

export type UserRole = "customer" | "merchant" | "manager" | "admin"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  phone_number?: string
  subscription?: {
    package_id?: string
    started_at?: string
    expired_at?: string
    features?: string[]
  }
  merchant_profile?: {
    shop_name: string
    address: string
    description?: string
    rating: number
    revenue_stats: number
  }
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (
    name: string,
    email: string,
    password: string,
    role: UserRole,
    merchantData?: { shop_name?: string; address?: string }
  ) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

// Helper to map API role to frontend role format
function mapRole(role: string): UserRole {
  const roleMap: Record<string, UserRole> = {
    CUSTOMER: "customer",
    MERCHANT: "merchant",
    MANAGER: "manager",
    ADMIN: "admin",
  }
  return roleMap[role] || "customer"
}

// Helper to map API user to frontend user format
function mapApiUserToUser(apiUser: any): User {
  return {
    id: apiUser.id || apiUser._id,
    name: apiUser.full_name,
    email: apiUser.email,
    role: mapRole(apiUser.role),
    avatar: apiUser.avatar?.url || apiUser.avatar,
    phone_number: apiUser.phone_number,
    subscription: apiUser.subscription,
    merchant_profile: apiUser.merchant_profile,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem("tailmates_token")
      const savedUser = localStorage.getItem("tailmates_user")

      if (token && savedUser) {
        try {
          // Verify token is still valid by fetching current user
          const response = await authAPI.getMe()
          if (response.success && response.data) {
            const mappedUser = mapApiUserToUser(response.data)
            setUser(mappedUser)
            localStorage.setItem("tailmates_user", JSON.stringify(mappedUser))
          } else {
            // Token invalid, clear storage
            localStorage.removeItem("tailmates_token")
            localStorage.removeItem("tailmates_user")
          }
        } catch {
          // Network error, use cached user
          setUser(JSON.parse(savedUser))
        }
      }
      setIsLoading(false)
    }

    checkSession()
  }, [])

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authAPI.login(email, password)

      if (response.success && response.data) {
        const { user: apiUser, token } = response.data
        const mappedUser = mapApiUserToUser(apiUser)

        // Save token and user
        localStorage.setItem("tailmates_token", token)
        localStorage.setItem("tailmates_user", JSON.stringify(mappedUser))
        setUser(mappedUser)

        return { success: true }
      }

      return { success: false, error: response.message || "Đăng nhập thất bại" }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, error: "Lỗi kết nối. Vui lòng thử lại." }
    }
  }

  const register = async (
    name: string,
    email: string,
    password: string,
    role: UserRole,
    merchantData?: { shop_name?: string; address?: string }
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const roleMap: Record<UserRole, string> = {
        customer: "CUSTOMER",
        merchant: "MERCHANT",
        manager: "MANAGER",
        admin: "ADMIN",
      }

      const response = await authAPI.register({
        email,
        password,
        full_name: name,
        role: roleMap[role],
        shop_name: merchantData?.shop_name,
        address: merchantData?.address,
      })

      if (response.success && response.data) {
        const { user: apiUser, token } = response.data
        const mappedUser = mapApiUserToUser(apiUser)

        // Save token and user
        localStorage.setItem("tailmates_token", token)
        localStorage.setItem("tailmates_user", JSON.stringify(mappedUser))
        setUser(mappedUser)

        return { success: true }
      }

      return { success: false, error: response.message || "Đăng ký thất bại" }
    } catch (error) {
      console.error("Register error:", error)
      return { success: false, error: "Lỗi kết nối. Vui lòng thử lại." }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("tailmates_token")
    localStorage.removeItem("tailmates_user")
  }

  const refreshUser = async () => {
    try {
      const response = await authAPI.getMe()
      if (response.success && response.data) {
        const mappedUser = mapApiUserToUser(response.data)
        setUser(mappedUser)
        localStorage.setItem("tailmates_user", JSON.stringify(mappedUser))
      }
    } catch (error) {
      console.error("Refresh user error:", error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
