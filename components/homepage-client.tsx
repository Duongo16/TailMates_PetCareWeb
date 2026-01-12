"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Homepage } from "@/components/homepage"

export function HomepageClient() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      // Redirect logged in users to their dashboard
      router.push(`/dashboard/${user.role}`)
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mint">
        <div className="animate-pulse text-navy">Đang tải...</div>
      </div>
    )
  }

  return <Homepage />
}
