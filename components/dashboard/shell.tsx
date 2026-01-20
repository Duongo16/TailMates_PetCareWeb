"use client"

import type React from "react"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Menu, X, LogOut, User, Bell, ShoppingCart, Package, Crown, Settings, Calendar, FileText, Info, CheckCheck, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { useCart } from "@/lib/cart-context"
import { CartModal } from "@/components/ui/cart-modal"
import { useNotifications, type Notification } from "@/lib/hooks"

interface Tab {
  id: string
  label: string
  icon: LucideIcon
}

interface DashboardShellProps {
  children: React.ReactNode
  tabs: Tab[]
  activeTab: string
  onTabChange: (tab: string) => void
}

export function DashboardShell({ children, tabs, activeTab, onTabChange }: DashboardShellProps) {
  const { user, logout } = useAuth()
  const { totalItems } = useCart()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)

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
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between h-16 px-4 lg:px-8">
          {/* Logo & Mobile Menu */}
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 rounded-xl hover:bg-secondary"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link href="/" className="flex items-center gap-2">
              <Image src="/images/avarta.png" alt="TailMates" width={100} height={40} className="h-8 w-auto" />
            </Link>
          </div>

          {/* Desktop Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-secondary/50 p-1 rounded-xl">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-foreground/70 hover:text-foreground hover:bg-secondary",
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            {/* Shopping Cart */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </Button>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-screen sm:w-80 max-h-[420px] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                  <span className="font-semibold text-foreground">Thông báo</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); markAllAsRead() }}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <CheckCheck className="w-3 h-3" /> Đọc tất cả
                    </button>
                  )}
                </div>

                {/* Notification List */}
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-foreground/60">
                    <Bell className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Không có thông báo</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={cn(
                        "flex items-start gap-3 p-3 cursor-pointer focus:bg-accent focus:text-accent-foreground group",
                        !notification.isRead && "bg-primary/5"
                      )}
                    >
                      {/* Icon */}
                      <div className={cn("w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0", getNotificationColor(notification.type))}>
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm truncate font-medium", !notification.isRead ? "text-foreground font-bold" : "text-foreground group-focus:text-accent-foreground")}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate group-focus:text-accent-foreground/90">{notification.message}</p>
                        <p className="text-xs text-muted-foreground/80 mt-1 group-focus:text-accent-foreground/70">{formatTimeAgo(notification.createdAt)}</p>
                      </div>

                      {/* Unread Indicator */}
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                      )}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-secondary transition-colors">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user?.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-foreground">{user?.name}</p>
                    <p className="text-xs text-foreground/60">{getRoleLabel(user?.role || "")}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-sm text-foreground/60">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onTabChange("orders")}>
                  <Package className="w-4 h-4 mr-2" />
                  Đơn hàng
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onTabChange("subscription")}>
                  <Crown className="w-4 h-4 mr-2" />
                  Nâng cấp
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onTabChange("settings")}>
                  <Settings className="w-4 h-4 mr-2" />
                  Cài đặt
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="lg:hidden border-t border-border bg-card">
            <div className="p-2 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      onTabChange(tab.id)
                      setMobileMenuOpen(false)
                    }}
                    className={cn(
                      "flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium transition-all",
                      activeTab === tab.id
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground/70 hover:bg-secondary",
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="p-4 lg:p-8 pb-24 lg:pb-8 max-w-7xl mx-auto">{children}</main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-inset-bottom">
        <div className="flex justify-around py-2">
          {tabs.slice(0, 4).map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[60px]",
                  activeTab === tab.id ? "text-primary" : "text-foreground/50",
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Cart Modal */}
      <CartModal
        open={cartOpen}
        onOpenChange={setCartOpen}
        onCheckout={() => {
          // Navigate to orders tab after checkout
          onTabChange("orders")
        }}
      />
    </div>
  )
}
