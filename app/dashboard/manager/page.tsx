"use client"

import { DashboardShell } from "@/components/dashboard/shell"
import { ManagerDashboardContent } from "@/components/manager/dashboard-content"
import { useState } from "react"
import { Home, TrendingUp, Package, Store, ImageIcon } from "lucide-react"

type ManagerTab = "dashboard" | "revenue" | "merchants" | "packages" | "banners"

const tabs = [
  { id: "dashboard" as ManagerTab, label: "Tổng quan", icon: Home },
  { id: "revenue" as ManagerTab, label: "Doanh thu", icon: TrendingUp },
  { id: "merchants" as ManagerTab, label: "Merchant", icon: Store },
  { id: "packages" as ManagerTab, label: "Gói đăng ký", icon: Package },
  { id: "banners" as ManagerTab, label: "Banner", icon: ImageIcon },
]

export default function ManagerDashboardPage() {
  const [activeTab, setActiveTab] = useState<ManagerTab>("dashboard")

  return (
    <DashboardShell tabs={tabs} activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as ManagerTab)}>
      <ManagerDashboardContent activeTab={activeTab} />
    </DashboardShell>
  )
}
