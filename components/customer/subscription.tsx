"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Rocket, Sparkles, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Subscription() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="w-full max-w-2xl overflow-hidden border-none shadow-xl bg-gradient-to-br from-white to-pink-50 dark:from-gray-900 dark:to-gray-800">
        <CardContent className="p-12 text-center space-y-8">
          {/* Animated Icon */}
          <div className="relative mx-auto w-32 h-32">
            <div className="absolute inset-0 bg-orange/20 rounded-full animate-ping opacity-75"></div>
            <div className="relative z-10 w-full h-full bg-gradient-to-br from-orange to-red-500 rounded-full flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-500">
              <Rocket className="w-16 h-16 text-white animate-bounce" />
            </div>
            <div className="absolute top-0 right-0">
              <Sparkles className="w-8 h-8 text-yellow-500 animate-spin-slow" />
            </div>
          </div>

          <div className="space-y-4">
            <Badge className="px-4 py-1.5 text-sm bg-orange/10 text-orange hover:bg-orange/20 border-orange/20 transition-colors">
              Đang phát triển
            </Badge>

            <h1 className="text-4xl md:text-5xl font-bold text-navy dark:text-white tracking-tight">
              Tính năng sắp ra mắt!
            </h1>

            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-lg mx-auto leading-relaxed">
              Chúng tôi đang chuẩn bị những gói thành viên hấp dẫn với nhiều đặc quyền dành riêng cho thú cưng của bạn.
              Hãy quay lại sau nhé!
            </p>
          </div>

          {/* Notify Button (Visual only for now) */}
          <div className="pt-4 flex justify-center">
            <Button className="rounded-full px-8 py-6 text-lg shadow-lg shadow-orange/20 bg-gradient-to-r from-orange to-red-500 hover:opacity-90 transition-opacity">
              <Bell className="w-5 h-5 mr-2" />
              Thông báo cho tôi
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
