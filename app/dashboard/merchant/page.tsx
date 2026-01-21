"use client"

import { DashboardShell } from "@/components/dashboard/shell"
import { MerchantDashboardContent } from "@/components/merchant/dashboard-content"
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Home, Package, Truck, Calendar, QrCode, Sparkles, Settings, Loader2, FileText, Newspaper } from "lucide-react"
import BlogList from "@/components/merchant/blog-list"

type MerchantTab = "dashboard" | "products" | "services" | "orders" | "bookings" | "medical-records" | "blog" | "scanner" | "settings"

const tabs = [
  { id: "dashboard" as MerchantTab, label: "Tổng quan", icon: Home },
  { id: "products" as MerchantTab, label: "Sản phẩm", icon: Package },
  { id: "services" as MerchantTab, label: "Dịch vụ", icon: Sparkles },
  { id: "orders" as MerchantTab, label: "Đơn hàng", icon: Truck },
  { id: "bookings" as MerchantTab, label: "Lịch hẹn", icon: Calendar },
  { id: "medical-records" as MerchantTab, label: "Sổ Y Tế", icon: FileText },
  { id: "blog" as MerchantTab, label: "Blog", icon: Newspaper },
  { id: "scanner" as MerchantTab, label: "Quét QR", icon: QrCode },
  { id: "settings" as MerchantTab, label: "Cài đặt", icon: Settings },
]

export default function MerchantDashboardPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<MerchantTab>("dashboard")

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
    <DashboardShell tabs={tabs} activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as MerchantTab)}>
      {activeTab === "blog" ? <BlogList /> : <MerchantDashboardContent activeTab={activeTab} />}
    </DashboardShell>
  )
}

