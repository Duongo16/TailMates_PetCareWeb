"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { authAPI, petsAPI } from "@/lib/api"
import { AuthPromptModal } from "@/components/ui/auth-prompt-modal"

const TEMP_PET_DATA_KEY = "temp_pet_data"
const ACCESS_TOKEN_KEY = "tailmates_token"
const REFRESH_TOKEN_KEY = "tailmates_refresh_token"
const USER_KEY = "tailmates_user"

export type UserRole = "customer" | "merchant" | "manager" | "admin"
export type AuthProvider = "EMAIL" | "GOOGLE"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  phone_number?: string
  is_email_verified?: boolean
  auth_provider?: AuthProvider
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
    website?: string
    banners?: { url: string; public_id?: string }[]
    categories?: string[]
    working_hours?: string
    social_links?: {
      facebook?: string
      instagram?: string
      zalo?: string
    }
  }
  tm_balance?: number
}

interface AuthResult {
  success: boolean
  error?: string
  waitSeconds?: number
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  showAuthPrompt: boolean
  setShowAuthPrompt: (show: boolean) => void
  requireAuth: (callback?: () => void) => boolean
  // Email/Password login
  login: (email: string, password: string) => Promise<AuthResult>
  // OTP Registration flow
  sendOtp: (data: {
    email: string
    password: string
    full_name: string
    phone_number?: string
    role?: UserRole
    shop_name?: string
    address?: string
    terms_accepted: boolean
  }) => Promise<AuthResult>
  verifyOtp: (email: string, otp: string) => Promise<AuthResult>
  resendOtp: (email: string) => Promise<AuthResult>
  // Legacy register (direct without OTP)
  register: (
    name: string,
    email: string,
    password: string,
    role: UserRole,
    merchantData?: { shop_name?: string; address?: string },
    termsAccepted?: boolean
  ) => Promise<AuthResult>
  // Google OAuth
  loginWithGoogle: (idToken: string) => Promise<AuthResult & { isNewUser?: boolean; accountLinked?: boolean }>
  // Session management
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  refreshAccessToken: () => Promise<boolean>
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
    is_email_verified: apiUser.is_email_verified,
    auth_provider: apiUser.auth_provider,
    subscription: apiUser.subscription,
    merchant_profile: apiUser.merchant_profile,
    tm_balance: apiUser.tm_balance,
  }
}

// Helper to save tokens
function saveTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

// Helper to clear tokens
function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
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
    const token = localStorage.getItem(ACCESS_TOKEN_KEY)
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

  // Refresh access token using refresh token
  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    if (!refreshToken) return false

    try {
      const response = await authAPI.refreshToken(refreshToken)
      if (response.success && response.data) {
        saveTokens(response.data.accessToken, response.data.refreshToken)
        return true
      }
      // Refresh token expired or invalid
      clearTokens()
      setUser(null)
      return false
    } catch (error) {
      console.error("Refresh token error:", error)
      return false
    }
  }, [])

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY)
      const savedUser = localStorage.getItem(USER_KEY)

      if (token && savedUser) {
        try {
          // Verify token is still valid by fetching current user
          const response = await authAPI.getMe()
          if (response.success && response.data) {
            const mappedUser = mapApiUserToUser(response.data)
            setUser(mappedUser)
            localStorage.setItem(USER_KEY, JSON.stringify(mappedUser))
          } else if (response.message?.includes("TOKEN_EXPIRED") || response.message?.includes("expired")) {
            // Try to refresh the token
            const refreshed = await refreshAccessToken()
            if (refreshed) {
              // Retry getting user
              const retryResponse = await authAPI.getMe()
              if (retryResponse.success && retryResponse.data) {
                const mappedUser = mapApiUserToUser(retryResponse.data)
                setUser(mappedUser)
                localStorage.setItem(USER_KEY, JSON.stringify(mappedUser))
              } else {
                clearTokens()
              }
            }
          } else {
            // Token invalid, clear storage
            clearTokens()
          }
        } catch {
          // Network error, use cached user
          setUser(JSON.parse(savedUser))
        }
      }
      setIsLoading(false)
    }

    checkSession()
  }, [refreshAccessToken])

  // Login with email and password
  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const response = await authAPI.login(email, password)

      if (response.success && response.data) {
        const { user: apiUser, accessToken, refreshToken, token } = response.data
        const mappedUser = mapApiUserToUser(apiUser)

        // Support both new (accessToken/refreshToken) and legacy (token) response
        if (accessToken && refreshToken) {
          saveTokens(accessToken, refreshToken)
        } else if (token) {
          localStorage.setItem(ACCESS_TOKEN_KEY, token)
        }
        
        localStorage.setItem(USER_KEY, JSON.stringify(mappedUser))
        setUser(mappedUser)

        // Auto-sync onboarding pet data if exists (for customers only)
        if (mappedUser.role === "customer") {
          await syncOnboardingPet()
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

  // Send OTP for registration
  const sendOtp = async (data: {
    email: string
    password: string
    full_name: string
    phone_number?: string
    role?: UserRole
    shop_name?: string
    address?: string
    terms_accepted: boolean
  }): Promise<AuthResult> => {
    try {
      const roleMap: Record<UserRole, string> = {
        customer: "CUSTOMER",
        merchant: "MERCHANT",
        manager: "MANAGER",
        admin: "ADMIN",
      }

      const response = await authAPI.sendOtp({
        ...data,
        role: data.role ? roleMap[data.role] : "CUSTOMER",
      })

      if (response.success) {
        return { success: true, waitSeconds: response.data?.waitSeconds || 60 }
      }

      return { 
        success: false, 
        error: response.message || "Không thể gửi OTP",
        waitSeconds: response.retryAfter 
      }
    } catch (error) {
      console.error("Send OTP error:", error)
      return { success: false, error: "Lỗi kết nối. Vui lòng thử lại." }
    }
  }

  // Verify OTP and complete registration
  const verifyOtp = async (email: string, otp: string): Promise<AuthResult> => {
    try {
      const response = await authAPI.verifyOtp(email, otp)

      if (response.success && response.data) {
        const { user: apiUser, accessToken, refreshToken } = response.data
        const mappedUser = mapApiUserToUser(apiUser)

        saveTokens(accessToken, refreshToken)
        localStorage.setItem(USER_KEY, JSON.stringify(mappedUser))
        setUser(mappedUser)

        // Auto-sync onboarding pet data if exists (for customers only)
        if (mappedUser.role === "customer") {
          await syncOnboardingPet()
          await checkProfileNotifications()
        }

        return { success: true }
      }

      return { success: false, error: response.message || "Xác thực OTP thất bại" }
    } catch (error) {
      console.error("Verify OTP error:", error)
      return { success: false, error: "Lỗi kết nối. Vui lòng thử lại." }
    }
  }

  // Resend OTP
  const resendOtp = async (email: string): Promise<AuthResult> => {
    try {
      const response = await authAPI.resendOtp(email)

      if (response.success) {
        return { success: true, waitSeconds: response.data?.waitSeconds || 60 }
      }

      return { 
        success: false, 
        error: response.message || "Không thể gửi lại OTP",
        waitSeconds: response.retryAfter 
      }
    } catch (error) {
      console.error("Resend OTP error:", error)
      return { success: false, error: "Lỗi kết nối. Vui lòng thử lại." }
    }
  }

  // Legacy register (direct without OTP - kept for backward compatibility)
  const register = async (
    name: string,
    email: string,
    password: string,
    role: UserRole,
    merchantData?: { shop_name?: string; address?: string },
    termsAccepted?: boolean
  ): Promise<AuthResult> => {
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
        terms_accepted: termsAccepted,
      })

      if (response.success && response.data) {
        const { user: apiUser, accessToken, refreshToken, token } = response.data
        const mappedUser = mapApiUserToUser(apiUser)

        // Support both new and legacy response
        if (accessToken && refreshToken) {
          saveTokens(accessToken, refreshToken)
        } else if (token) {
          localStorage.setItem(ACCESS_TOKEN_KEY, token)
        }
        
        localStorage.setItem(USER_KEY, JSON.stringify(mappedUser))
        setUser(mappedUser)

        // Auto-sync onboarding pet data if exists (for customers only)
        if (mappedUser.role === "customer") {
          await syncOnboardingPet()
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

  // Login with Google OAuth
  const loginWithGoogle = async (idToken: string): Promise<AuthResult & { isNewUser?: boolean; accountLinked?: boolean }> => {
    try {
      const response = await authAPI.loginWithGoogle(idToken)

      if (response.success && response.data) {
        const { user: apiUser, accessToken, refreshToken, isNewUser, accountLinked } = response.data
        const mappedUser = mapApiUserToUser(apiUser)

        saveTokens(accessToken, refreshToken)
        localStorage.setItem(USER_KEY, JSON.stringify(mappedUser))
        setUser(mappedUser)

        // Auto-sync onboarding pet data if exists (for customers only)
        if (mappedUser.role === "customer") {
          await syncOnboardingPet()
          await checkProfileNotifications()
        }

        return { success: true, isNewUser, accountLinked }
      }

      return { success: false, error: response.message || "Đăng nhập Google thất bại" }
    } catch (error) {
      console.error("Google login error:", error)
      return { success: false, error: "Lỗi kết nối. Vui lòng thử lại." }
    }
  }

  // Logout
  const logout = async () => {
    try {
      // Call logout API to invalidate refresh tokens
      await authAPI.logout()
    } catch (error) {
      console.error("Logout API error:", error)
      // Continue with local logout even if API fails
    }
    
    setUser(null)
    clearTokens()
  }

  // Refresh user data
  const refreshUser = async () => {
    try {
      const response = await authAPI.getMe()
      if (response.success && response.data) {
        const mappedUser = mapApiUserToUser(response.data)
        setUser(mappedUser)
        localStorage.setItem(USER_KEY, JSON.stringify(mappedUser))
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
      sendOtp,
      verifyOtp,
      resendOtp,
      register,
      loginWithGoogle,
      logout,
      refreshUser,
      refreshAccessToken,
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
