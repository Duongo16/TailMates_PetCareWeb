"use client"

import { MerchantAnalytics } from "@/components/merchant/merchant-analytics"
import { DashboardShell } from "@/components/dashboard/shell"
import { MERCHANT_TABS, type MerchantTab } from "@/lib/merchant-constants"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

export default function AnalyticsPage() {
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

    return (
        <DashboardShell
            tabs={MERCHANT_TABS}
            activeTab="dashboard"
            onTabChange={(tab) => router.push(`/dashboard/merchant?tab=${tab}`)}
        >
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <MerchantAnalytics />
            </div>
        </DashboardShell>
    )
}
