"use client"

import type React from "react"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useFeatureAccess, type FeatureKey } from "@/hooks/use-feature-access"
import { Lock } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Menu, X, LogOut, User, Bell, ShoppingCart, Package, Crown, Settings, Calendar, FileText, Info, CheckCheck, type LucideIcon, Coins, Clock, PawPrint, Newspaper } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { useCart } from "@/lib/cart-context"
import { CartModal } from "@/components/ui/cart-modal"
import { useNotifications, type Notification } from "@/lib/hooks"
import { GlobalChatOverlay } from "@/components/chat/global-chat-overlay"
import { UserBalance } from "@/components/user-balance"
import { DashboardHeader } from "./dashboard-header"

interface Tab {
  id: string
  label: string
  icon: LucideIcon
  featureKey?: FeatureKey
  children?: Tab[]
}

interface DashboardShellProps {
  children: React.ReactNode
  tabs: Tab[]
  activeTab: string
  onTabChange: (tab: string) => void
}

export function DashboardShell({ children, tabs, activeTab, onTabChange }: DashboardShellProps) {
  const { user, logout } = useAuth()
  const { canAccess } = useFeatureAccess()
  const { totalItems } = useCart()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)

  // Listen for custom switch-tab event (e.g. from FeatureGate)
  useEffect(() => {
    const handleSwitchTab = (e: any) => {
      if (e.detail && typeof e.detail === 'string') {
        const tabExists = tabs.some(t => t.id === e.detail || t.children?.some((c: any) => c.id === e.detail))
        if (tabExists) {
          onTabChange(e.detail)
        }
      }
    }

    window.addEventListener('switch-tab', handleSwitchTab)
    return () => window.removeEventListener('switch-tab', handleSwitchTab)
  }, [tabs, onTabChange])

  // Notification helper functions
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'ORDER_UPDATE': return <Package className="w-4 h-4 text-white" />
      case 'BOOKING_UPDATE': return <Calendar className="w-4 h-4 text-white" />
      case 'MEDICAL_RECORD': return <FileText className="w-4 h-4 text-white" />
      case 'SUBSCRIPTION': return <Crown className="w-4 h-4 text-white" />
      default: return <Info className="w-4 h-4 text-white" />
    }
  }

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'ORDER_UPDATE': return 'bg-green-500'
      case 'BOOKING_UPDATE': return 'bg-blue-500'
      case 'MEDICAL_RECORD': return 'bg-purple-500'
      case 'SUBSCRIPTION': return 'bg-amber-500'
      default: return 'bg-gray-500'
    }
  }

  const formatTimeAgo = (date?: Date) => {
    if (!date) return ''
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Vừa xong'
    if (diffMins < 60) return `${diffMins} phút trước`
    if (diffHours < 24) return `${diffHours} giờ trước`
    return `${diffDays} ngày trước`
  }

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification._id || notification.id!)
    if (notification.redirectTab) {
      onTabChange(notification.redirectTab)
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "customer":
        return "Khách hàng"
      case "merchant":
        return "Đối tác"
      case "manager":
        return "Quản lý"
      case "admin":
        return "Admin"
      default:
        return role
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader 
        tabs={tabs} 
        activeTab={activeTab} 
        onTabChange={onTabChange} 
      />

      {/* Main Content */}
      <main className="p-4 lg:p-8 pb-24 md:pb-4 lg:pb-8 max-w-7xl mx-auto">{children}</main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-inset-bottom">
        <div className="flex justify-around py-2">
          {tabs.slice(0, 4).map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors min-w-[60px]",
                  isActive ? "text-primary" : "text-foreground/50",
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeBottomTab"
                    className="absolute inset-0 bg-primary/10 rounded-xl"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <div className="relative">
                  <Icon className="w-5 h-5 relative z-10" />
                  {tab.featureKey && !canAccess(tab.featureKey) && (
                    <Lock className="w-2.5 h-2.5 text-amber-500 absolute -top-1 -right-1 z-20" />
                  )}
                </div>
                <span className="text-xs font-medium relative z-10">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Global Chat Overlay - accessible to all logged-in users */}
      <GlobalChatOverlay />
    </div>
  )
}
