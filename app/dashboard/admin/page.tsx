"use client"

import { DashboardShell } from "@/components/dashboard/shell"
import { AdminDashboardContent } from "@/components/admin/dashboard-content"
import { useState } from "react"
import { Home, Users, Settings, Shield } from "lucide-react"

type AdminTab = "dashboard" | "users" | "settings" | "security"

const tabs = [
  { id: "dashboard" as AdminTab, label: "Tổng quan", icon: Home },
  { id: "users" as AdminTab, label: "Người dùng", icon: Users },
  { id: "settings" as AdminTab, label: "Cài đặt", icon: Settings },
  { id: "security" as AdminTab, label: "Bảo mật", icon: Shield },
]

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard")

  return (
    <DashboardShell tabs={tabs} activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as AdminTab)}>
      <AdminDashboardContent activeTab={activeTab} />
    </DashboardShell>
  )
}
