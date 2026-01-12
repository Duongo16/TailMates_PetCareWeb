"use client"

import { DashboardShell } from "@/components/dashboard/shell"
import { MerchantDashboardContent } from "@/components/merchant/dashboard-content"
import { useState } from "react"
import { Home, Package, Truck, Calendar, QrCode, Sparkles } from "lucide-react"

type MerchantTab = "dashboard" | "products" | "services" | "orders" | "bookings" | "scanner"

const tabs = [
  { id: "dashboard" as MerchantTab, label: "Tổng quan", icon: Home },
  { id: "products" as MerchantTab, label: "Sản phẩm", icon: Package },
  { id: "services" as MerchantTab, label: "Dịch vụ", icon: Sparkles },
  { id: "orders" as MerchantTab, label: "Đơn hàng", icon: Truck },
  { id: "bookings" as MerchantTab, label: "Lịch hẹn", icon: Calendar },
  { id: "scanner" as MerchantTab, label: "Quét QR", icon: QrCode },
]

export default function MerchantDashboardPage() {
  const [activeTab, setActiveTab] = useState<MerchantTab>("dashboard")

  return (
    <DashboardShell tabs={tabs} activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as MerchantTab)}>
      <MerchantDashboardContent activeTab={activeTab} />
    </DashboardShell>
  )
}
