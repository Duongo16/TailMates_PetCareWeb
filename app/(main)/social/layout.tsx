"use client"

import { SiteHeader } from "@/components/site-header"
import { GlobalChatOverlay } from "@/components/chat/global-chat-overlay"

export default function SocialLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        {children}
      </main>
      <GlobalChatOverlay />
    </div>
  )
}
