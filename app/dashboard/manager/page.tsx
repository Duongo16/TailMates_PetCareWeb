"use client"

import { DashboardShell } from "@/components/dashboard/shell"
import { ManagerDashboardContent } from "@/components/manager/dashboard-content"
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Home, TrendingUp, Package, Store, ImageIcon, Settings, Loader2 } from "lucide-react"

type ManagerTab = "dashboard" | "revenue" | "merchants" | "packages" | "banners" | "settings"

const tabs = [
  { id: "dashboard" as ManagerTab, label: "Tổng quan", icon: Home },
  { id: "revenue" as ManagerTab, label: "Doanh thu", icon: TrendingUp },
  { id: "merchants" as ManagerTab, label: "Merchant", icon: Store },
  { id: "packages" as ManagerTab, label: "Gói đăng ký", icon: Package },
  { id: "banners" as ManagerTab, label: "Banner", icon: ImageIcon },
  { id: "settings" as ManagerTab, label: "Cài đặt", icon: Settings },
]

export default function ManagerDashboardPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<ManagerTab>("dashboard")

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-secondary">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // Don't render dashboard if not logged in (will redirect)
  if (!user) {
    return null
  }

  return (
    <DashboardShell tabs={tabs} activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as ManagerTab)}>
      <ManagerDashboardContent activeTab={activeTab} />
    </DashboardShell>
  )
}

