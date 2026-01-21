"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { authAPI, petsAPI } from "@/lib/api"
import { AuthPromptModal } from "@/components/ui/auth-prompt-modal"

const TEMP_PET_DATA_KEY = "temp_pet_data"
const TOKEN_EXPIRY_HOURS = 1 // Token expires after 1 hour

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
  showAuthPrompt: boolean
  setShowAuthPrompt: (show: boolean) => void
  requireAuth: (callback?: () => void) => boolean
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

// Helper to sync onboarding pet data after login/register
async function syncOnboardingPet(): Promise<void> {
  try {
    const tempDataStr = localStorage.getItem(TEMP_PET_DATA_KEY)
    if (!tempDataStr) return

    const tempData = JSON.parse(tempDataStr)
    if (!tempData.name || !tempData.species) return

    // Create the pet via API with all collected data
    await petsAPI.create({
      name: tempData.name,
      species: tempData.species,
      breed: tempData.breed,
      age_months: tempData.age_months || 24,
      gender: tempData.gender || "MALE",
      color: tempData.color,
      fur_type: tempData.fur_type,
    })

    // Clear the temporary data
    localStorage.removeItem(TEMP_PET_DATA_KEY)
    console.log("Onboarding pet synced successfully:", tempData.name)
  } catch (error) {
    console.error("Failed to sync onboarding pet:", error)
    // Don't throw - we don't want to break the login/register flow
  }
}

// Helper to check profile/pet completeness and create reminder notifications
async function checkProfileNotifications(): Promise<void> {
  try {
    const token = localStorage.getItem("tailmates_token")
    if (!token) return

    await fetch("/api/v1/notifications/check-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
    console.log("Profile notifications checked")
  } catch (error) {
    console.error("Failed to check profile notifications:", error)
    // Don't throw - this is a non-critical operation
  }
}


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)

  // Function to check auth and show prompt if needed
  const requireAuth = useCallback((callback?: () => void): boolean => {
    if (user) {
      callback?.()
      return true
    }
    setShowAuthPrompt(true)
    return false
  }, [user])

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem("tailmates_token")
      const savedUser = localStorage.getItem("tailmates_user")
      const tokenExpiry = localStorage.getItem("tailmates_token_expiry")

      if (token && savedUser) {
        // Check if token has expired
        if (tokenExpiry) {
          const expiryTime = parseInt(tokenExpiry, 10)
          const now = Date.now()

          if (now > expiryTime) {
            // Token expired, clear storage
            localStorage.removeItem("tailmates_token")
            localStorage.removeItem("tailmates_user")
            localStorage.removeItem("tailmates_token_expiry")
            setIsLoading(false)
            return
          }
        }

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
            localStorage.removeItem("tailmates_token_expiry")
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

        // Calculate token expiry time (1 hour from now)
        const expiryTime = Date.now() + (TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)

        // Save token, user, and expiry time
        localStorage.setItem("tailmates_token", token)
        localStorage.setItem("tailmates_user", JSON.stringify(mappedUser))
        localStorage.setItem("tailmates_token_expiry", expiryTime.toString())
        setUser(mappedUser)

        // Auto-sync onboarding pet data if exists (for customers only)
        if (mappedUser.role === "customer") {
          await syncOnboardingPet()
          // Check for incomplete profile/pet data and create notifications
          await checkProfileNotifications()
        }

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

        // Calculate token expiry time (1 hour from now)
        const expiryTime = Date.now() + (TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)

        // Save token, user, and expiry time
        localStorage.setItem("tailmates_token", token)
        localStorage.setItem("tailmates_user", JSON.stringify(mappedUser))
        localStorage.setItem("tailmates_token_expiry", expiryTime.toString())
        setUser(mappedUser)

        // Auto-sync onboarding pet data if exists (for customers only)
        if (mappedUser.role === "customer") {
          await syncOnboardingPet()
          // Check for incomplete profile/pet data and create notifications
          await checkProfileNotifications()
        }

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
    localStorage.removeItem("tailmates_token_expiry")
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
    <AuthContext.Provider value={{
      user,
      isLoading,
      showAuthPrompt,
      setShowAuthPrompt,
      requireAuth,
      login,
      register,
      logout,
      refreshUser
    }}>
      {children}
      <AuthPromptModal
        open={showAuthPrompt}
        onOpenChange={setShowAuthPrompt}
      />
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
