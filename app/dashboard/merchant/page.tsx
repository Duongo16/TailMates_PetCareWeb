"use client"

import { DashboardShell } from "@/components/dashboard/shell"
import { MerchantDashboardContent } from "@/components/merchant/dashboard-content"
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter, useSearchParams } from "next/navigation"
import { MERCHANT_TABS, type MerchantTab } from "@/lib/merchant-constants"
import { Loader2 } from "lucide-react"
import BlogList from "@/components/merchant/blog-list"

export default function MerchantDashboardPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<MerchantTab>("dashboard")

  // Handle tab from URL
  useEffect(() => {
    const tab = searchParams.get("tab") as MerchantTab
    if (tab && MERCHANT_TABS.some(t => t.id === tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

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
    <DashboardShell tabs={MERCHANT_TABS} activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as MerchantTab)}>
      {activeTab === "blog" ? <BlogList /> : <MerchantDashboardContent activeTab={activeTab} setActiveTab={setActiveTab} />}
    </DashboardShell>
  )
}

