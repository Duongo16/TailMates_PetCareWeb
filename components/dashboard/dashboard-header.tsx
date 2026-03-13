"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useFeatureAccess } from "@/hooks/use-feature-access"
import { 
  Menu, X, LogOut, User, Users, Bell, ShoppingCart, Package, Crown, Settings, 
  Calendar, FileText, Info, CheckCheck, Coins, Clock, PawPrint, Newspaper, Lock, ChevronRight, ChevronDown 
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useCart } from "@/lib/cart-context"
import { useNotifications, type Notification } from "@/lib/hooks"
import { UserBalance } from "@/components/user-balance"
import { getTabsByRole, type TabItem } from "@/lib/tabs-config"
import { CartModal } from "@/components/ui/cart-modal"

interface DashboardHeaderProps {
  tabs?: TabItem[]
  activeTab?: string
  onTabChange?: (tab: string) => void
  isExternal?: boolean // If true, clicking tabs will navigate to /dashboard/[role]?tab=[id]
}

export function DashboardHeader({ 
  tabs: propTabs, 
  activeTab, 
  onTabChange, 
  isExternal = false 
}: DashboardHeaderProps) {
  const { user, logout } = useAuth()
  const { canAccess } = useFeatureAccess()
  const { totalItems } = useCart()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)

  // Use provided tabs or get them from role
  const roleTabs = propTabs || (user ? getTabsByRole(user.role) : [])
  
  const allTabs = [
    { id: "social", label: "Cộng đồng", icon: PawPrint },
    { id: "blog-nav", label: "Blog", icon: Newspaper },
    ...roleTabs
  ]

  const handleTabClick = (tabId: string) => {
    if (tabId === "social") {
      router.push("/social")
      return
    }
    if (tabId === "blog-nav") {
      router.push("/blog")
      return
    }
    if (isExternal || !onTabChange) {
      router.push(`/dashboard/${user?.role}?tab=${tabId}`)
    } else {
      onTabChange(tabId)
    }
  }

  const isSocialActive = pathname === "/social" || pathname.startsWith("/social/")
  const isBlogActive = pathname.startsWith("/blog")
  const currentActiveTab = activeTab || (isSocialActive ? "social" : isBlogActive ? "blog-nav" : "")

  // Check if a child of a group is active
  const isGroupActive = (tab: TabItem) => {
    if (!tab.children) return false
    return tab.children.some(child => currentActiveTab === child.id)
  }

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
      handleTabClick(notification.redirectTab)
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "customer": return "Khách hàng"
      case "merchant": return "Đối tác"
      case "manager": return "Quản lý"
      case "admin": return "Admin"
      default: return role
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        {/* Main header row: Logo + Centered Tabs + Icons */}
        <div className="flex items-center h-14 px-4 lg:px-6 xl:px-8">
          {/* Left: Logo & Mobile Menu toggle */}
          <div className="flex-1 flex items-center gap-2">
            <button
              className="md:hidden p-2 rounded-xl hover:bg-secondary"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link href="/" className="flex items-center gap-2">
              <Image src="/images/logo-ngang.png" alt="TailMates" width={100} height={40} className="h-8 w-auto min-w-[100px]" />
            </Link>
          </div>

          {/* Center: Desktop Tabs — inline on lg+ */}
          <div className="flex-none hidden lg:block">
            <nav className="flex items-center gap-0.5 xl:gap-1 bg-secondary/50 p-1 rounded-xl">
              {allTabs.map((tab) => {
                const Icon = tab.icon
                const isActive = currentActiveTab === tab.id || isGroupActive(tab)

                // Grouped tab with hover dropdown
                if (tab.children) {
                  return (
                    <div key={tab.id} className="relative group">
                      <button
                        className={cn(
                          "relative flex items-center gap-1.5 px-2.5 xl:px-4 py-2 rounded-lg text-sm font-medium transition-colors z-10 whitespace-nowrap",
                          isActive
                            ? "text-primary-foreground"
                            : "text-foreground/70 hover:text-foreground",
                        )}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeTab"
                            className="absolute inset-0 bg-primary rounded-lg shadow-sm"
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          />
                        )}
                        <div className="relative z-10 flex items-center gap-1.5">
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <span className="hidden xl:inline">{tab.label}</span>
                          <span className="inline xl:hidden text-xs">{tab.label}</span>
                          <ChevronDown className="w-3 h-3 opacity-60" />
                        </div>
                      </button>
                      {/* Dropdown */}
                      <div className="absolute top-full left-0 pt-1 hidden group-hover:block z-50">
                        <div className="bg-card rounded-xl shadow-lg border border-border py-1 min-w-[160px]">
                          {tab.children.map((child) => {
                            const ChildIcon = child.icon
                            const isChildActive = currentActiveTab === child.id
                            return (
                              <button
                                key={child.id}
                                onClick={() => handleTabClick(child.id)}
                                className={cn(
                                  "w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors",
                                  isChildActive
                                    ? "text-primary bg-primary/5"
                                    : "text-foreground/70 hover:text-foreground hover:bg-secondary",
                                )}
                              >
                                <ChildIcon className="w-4 h-4 flex-shrink-0" />
                                {child.label}
                                {child.featureKey && !canAccess(child.featureKey) && (
                                  <Lock className="w-3 h-3 text-amber-500 opacity-80 ml-auto" />
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                }

                // Normal tab
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={cn(
                      "relative flex items-center gap-1.5 px-2.5 xl:px-4 py-2 rounded-lg text-sm font-medium transition-colors z-10 whitespace-nowrap",
                      isActive
                        ? "text-primary-foreground"
                        : "text-foreground/70 hover:text-foreground",
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-primary rounded-lg shadow-sm"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <div className="relative z-10 flex items-center gap-1.5">
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="hidden xl:inline">{tab.label}</span>
                      <span className="inline xl:hidden text-xs">{tab.label}</span>
                      {tab.featureKey && !canAccess(tab.featureKey) && (
                        <Lock className="w-3 h-3 text-amber-500 opacity-80 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Right: Icons & Profile */}
          <div className="flex-1 flex items-center justify-end gap-1 sm:gap-2">

            {/* Shopping Cart */}
            {user?.role === "customer" && (
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
            )}

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
              <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] sm:w-80 max-h-[420px] overflow-y-auto">
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
                      <div className={cn("w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0", getNotificationColor(notification.type))}>
                        {getNotificationIcon(notification.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm truncate font-medium", !notification.isRead ? "text-foreground font-bold" : "text-foreground group-focus:text-accent-foreground")}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate group-focus:text-accent-foreground/90">{notification.message}</p>
                        <p className="text-xs text-muted-foreground/80 mt-1 group-focus:text-accent-foreground/70">{formatTimeAgo(notification.createdAt)}</p>
                      </div>

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
                <button className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-secondary transition-colors text-left">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user?.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-foreground">{user?.name}</p>
                    <p className="text-xs text-foreground/60">{getRoleLabel(user?.role || "")}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem 
                  onClick={() => router.push(`/social/profile/${user?.id}`)}
                  className="flex items-center justify-between px-3 py-3 cursor-pointer focus:bg-primary/5 focus:text-primary mb-1 transition-all group"
                >
                  <div className="flex flex-col items-start min-w-0">
                    <p className="font-bold truncate w-full group-focus:text-primary transition-colors">{user?.name}</p>
                    <p className="text-[11px] text-foreground/50 truncate w-full mb-1">{user?.email}</p>
                    <span className="text-[10px] font-semibold text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded-md mt-0.5 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity">
                      Xem trang cá nhân
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-focus:text-primary transition-all group-focus:translate-x-1" />
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => router.push("/social/friends")}
                  className="focus:bg-primary/5 focus:text-primary cursor-pointer transition-colors"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Bạn bè
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {["customer", "merchant"].includes(user?.role || "") && (
                  <>
                    <div className="px-3 pb-2">
                      <UserBalance showAdd={false} />
                    </div>
                    <DropdownMenuItem 
                      onClick={() => router.push("/top-up")}
                      className="focus:bg-primary/5 focus:text-primary cursor-pointer transition-colors"
                    >
                      <Coins className="w-4 h-4 mr-2 text-yellow-500" />
                      Nạp tiền TM
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => router.push("/dashboard/transactions")}
                      className="focus:bg-primary/5 focus:text-primary cursor-pointer transition-colors"
                    >
                      <Clock className="w-4 h-4 mr-2 text-blue-500" />
                      Lịch sử giao dịch
                    </DropdownMenuItem>
                  </>
                )}
                {user?.role === "customer" && (
                  <>
                    <DropdownMenuItem 
                      onClick={() => handleTabClick("orders")}
                      className="focus:bg-primary/5 focus:text-primary cursor-pointer transition-colors"
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Đơn hàng
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleTabClick("subscription")}
                      className="focus:bg-primary/5 focus:text-primary cursor-pointer transition-colors"
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Nâng cấp
                    </DropdownMenuItem>
                  </>
                )}
                {user?.role === "manager" && (
                  <DropdownMenuItem 
                    onClick={() => router.push("/dashboard/manager/terms-policies")}
                    className="focus:bg-primary/5 focus:text-primary cursor-pointer transition-colors"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Điều khoản & Chính sách
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout} 
                  className="text-destructive focus:bg-destructive/5 focus:text-destructive cursor-pointer transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mid-size Tabs Row (md to lg) — scrollable horizontal bar */}
        <div className="hidden md:flex lg:hidden border-t border-border overflow-x-auto scrollbar-none">
          <div className="flex items-center justify-center w-full">
            <div className="flex items-center gap-0.5 px-3 py-1.5 min-w-max">
              {allTabs.map((tab) => {
                const Icon = tab.icon
                const isActive = currentActiveTab === tab.id || isGroupActive(tab)

                if (tab.children) {
                  return (
                    <div key={tab.id} className="relative group">
                      <button
                        className={cn(
                          "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground/70 hover:text-foreground hover:bg-secondary",
                        )}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span>{tab.label}</span>
                        <ChevronDown className="w-3 h-3 opacity-60" />
                      </button>
                      <div className="absolute top-full left-0 pt-1 hidden group-hover:block z-50">
                        <div className="bg-card rounded-xl shadow-lg border border-border py-1 min-w-[160px]">
                          {tab.children.map((child) => {
                            const ChildIcon = child.icon
                            const isChildActive = currentActiveTab === child.id
                            return (
                              <button
                                key={child.id}
                                onClick={() => handleTabClick(child.id)}
                                className={cn(
                                  "w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors",
                                  isChildActive
                                    ? "text-primary bg-primary/5"
                                    : "text-foreground/70 hover:text-foreground hover:bg-secondary",
                                )}
                              >
                                <ChildIcon className="w-4 h-4 flex-shrink-0" />
                                {child.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                }

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={cn(
                      "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground/70 hover:text-foreground hover:bg-secondary",
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{tab.label}</span>
                    {tab.featureKey && !canAccess(tab.featureKey) && (
                      <Lock className="w-3 h-3 text-amber-500 opacity-80 flex-shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Mobile Menu (below md) */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.nav
              className="md:hidden border-t border-border bg-card overflow-hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <div className="p-2 space-y-1">
                {allTabs.map((tab, index) => {
                  const Icon = tab.icon
                  const isActive = currentActiveTab === tab.id || isGroupActive(tab)

                  if (tab.children) {
                    return (
                      <div key={tab.id}>
                        <motion.div
                          className={cn(
                            "flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium text-foreground/50 text-xs uppercase tracking-wider",
                          )}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Icon className="w-4 h-4" />
                          {tab.label}
                        </motion.div>
                        {tab.children.map((child, ci) => {
                          const ChildIcon = child.icon
                          const isChildActive = currentActiveTab === child.id
                          return (
                            <motion.button
                              key={child.id}
                              onClick={() => {
                                handleTabClick(child.id)
                                setMobileMenuOpen(false)
                              }}
                              className={cn(
                                "relative flex items-center gap-3 w-full pl-8 pr-4 py-2.5 rounded-xl font-medium transition-colors",
                                isChildActive
                                  ? "text-primary-foreground"
                                  : "text-foreground/70 hover:bg-secondary",
                              )}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: (index + ci) * 0.05 }}
                            >
                              {isChildActive && (
                                <motion.div
                                  layoutId="activeMobileTab"
                                  className="absolute inset-0 bg-primary rounded-xl"
                                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                              )}
                              <ChildIcon className="w-4 h-4 relative z-10" />
                              <span className="relative z-10 text-sm">{child.label}</span>
                              {child.featureKey && !canAccess(child.featureKey) && (
                                <Lock className="w-3 h-3 text-amber-500 opacity-80 ml-auto relative z-10" />
                              )}
                            </motion.button>
                          )
                        })}
                      </div>
                    )
                  }

                  return (
                    <motion.button
                      key={tab.id}
                      onClick={() => {
                        handleTabClick(tab.id)
                        setMobileMenuOpen(false)
                      }}
                      className={cn(
                        "relative flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium transition-colors",
                        isActive
                          ? "text-primary-foreground"
                          : "text-foreground/70 hover:bg-secondary",
                      )}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeMobileTab"
                          className="absolute inset-0 bg-primary rounded-xl"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      <Icon className="w-5 h-5 relative z-10" />
                      <span className="relative z-10">{tab.label}</span>
                      {tab.featureKey && !canAccess(tab.featureKey) && (
                        <Lock className="w-3 h-3 text-amber-500 opacity-80 ml-auto relative z-10" />
                      )}
                    </motion.button>
                  )
                })}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      {/* Cart Modal */}
      <CartModal
        open={cartOpen}
        onOpenChange={setCartOpen}
        onCheckout={() => {
          handleTabClick("orders")
          setCartOpen(false)
        }}
      />
    </>
  )
}
