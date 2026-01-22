"use client"

import { useAuth } from "@/lib/auth-context"
import { Homepage } from "@/components/homepage"

export function HomepageClient() {
  const { isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mint">
        <div className="animate-pulse text-navy">Đang tải...</div>
      </div>
    )
  }

  return <Homepage />
}
