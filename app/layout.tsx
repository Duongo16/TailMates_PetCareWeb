import type React from "react"
import type { Metadata, Viewport } from "next"
import { Nunito } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/lib/auth-context"
import { CartProvider } from "@/lib/cart-context"
import { SakuraPetalsWrapper } from "@/components/sakura-wrapper"
import { ServiceWorkerRegister } from "@/components/service-worker-register"
import "./globals.css"

const nunito = Nunito({ subsets: ["latin", "vietnamese"] })

export const metadata: Metadata = {
  title: "TailMates - Bạn Đồng Hành Thú Cưng",
  description: "Ứng dụng chăm sóc thú cưng thông minh dành cho Gen Z",
  generator: "v0.app",
  manifest: "/manifest.json",
  icons: {
    icon: "/images/logo.png",
    shortcut: "/images/logo.png",
    apple: "/icons/icon-192x192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TailMates",
  },
}

export const viewport: Viewport = {
  themeColor: "#2D3561",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi">
      <body className={`font-sans antialiased`}>
        <ServiceWorkerRegister />
        <SakuraPetalsWrapper />
        <AuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
