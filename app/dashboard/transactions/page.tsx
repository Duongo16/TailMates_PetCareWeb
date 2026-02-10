"use client"

import { DashboardShell } from "@/components/dashboard/shell"
import { TransactionHistory } from "@/components/dashboard/transaction-history"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2, Home, PawPrint, ShoppingBag, Calendar, FileText, Newspaper, Crown, Sparkles, LayoutDashboard, Truck } from "lucide-react"
import { MERCHANT_TABS } from "@/lib/merchant-constants"

import { CUSTOMER_TABS } from "@/lib/customer-constants"

export default function TransactionsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-secondary">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) return null

  const tabs = user.role === "merchant" ? MERCHANT_TABS : CUSTOMER_TABS
  const dashboardPath = user.role === "merchant" ? "/dashboard/merchant" : "/dashboard/customer"

  const handleTabChange = (tabId: string) => {
    router.push(`${dashboardPath}?tab=${tabId}`)
  }

  return (
    <DashboardShell 
      tabs={tabs as any} 
      activeTab="transactions" // This won't match any tab ID, so none will be highlighted
      onTabChange={handleTabChange}
    >
      <TransactionHistory />
    </DashboardShell>
  )
}
