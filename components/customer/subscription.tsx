"use client"

import { useState } from "react"
import { useCustomerPackages } from "@/lib/hooks"
import { useAuth } from "@/lib/auth-context"
import { packagesAPI } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Crown, Sparkles, Zap, Loader2 } from "lucide-react"

export function Subscription() {
  const { data: packages, isLoading } = useCustomerPackages()
  const { user, refreshUser } = useAuth()
  const [processingId, setProcessingId] = useState<string | null>(null)

  const handleSubscribe = async (packageId: string) => {
    setProcessingId(packageId)
    try {
      const response = await packagesAPI.subscribeCustomer(packageId)
      if (response.success) {
        await refreshUser()
        alert("Đăng ký thành công!")
      } else {
        alert(response.message || "Đăng ký thất bại")
      }
    } catch (error) {
      alert("Lỗi kết nối")
    } finally {
      setProcessingId(null)
    }
  }

  const formatPrice = (price: number) => {
    if (price === 0) return "Miễn phí"
    return (
      new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      }).format(price) + "/tháng"
    )
  }

  const isCurrentPackage = (pkgId: string) => {
    // If user has no subscription, undefined/null check
    // If free package (usually price 0), and user has no sub or sub matches
    if (!user?.subscription?.package_id && pkgId === packages?.find(p=>p.price===0)?._id) return true;
    return user?.subscription?.package_id === pkgId
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 lg:pt-16">
      {/* Header */}
      <div className="text-center">
        <Badge className="bg-orange text-white mb-4">
          <Crown className="w-4 h-4 mr-1" />
          Nâng cấp tài khoản
        </Badge>
        <h1 className="text-3xl font-bold text-navy">Gói Thành Viên</h1>
        <p className="text-navy/60 mt-2">Mở khóa tính năng AI và nhiều ưu đãi hấp dẫn</p>
      </div>

      {/* Comparison Cards */}
      <div className="grid lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {packages?.map((pkg, index) => {
           const isPopular = pkg.price > 0 // Simple logic for popular tag
           const current = isCurrentPackage(pkg._id)

           return (
            <Card
              key={pkg._id}
              className={`relative overflow-hidden ${isPopular ? "ring-2 ring-orange shadow-xl" : ""}`}
            >
              {isPopular && (
                <div className="absolute top-0 right-0">
                  <Badge className="rounded-none rounded-bl-xl bg-orange text-white px-4 py-1">
                    <Zap className="w-4 h-4 mr-1" />
                    Phổ biến
                  </Badge>
                </div>
              )}
              <CardHeader className={`${isPopular ? "bg-gradient-to-r from-orange/10 to-peach/50" : "bg-sky/30"}`}>
                <CardTitle className="flex items-center gap-2 text-navy">
                  {isPopular ? (
                    <Sparkles className="w-6 h-6 text-orange" />
                  ) : (
                    <Crown className="w-6 h-6 text-navy/50" />
                  )}
                  {pkg.name}
                </CardTitle>
                <p className="text-3xl font-bold text-navy mt-2">{formatPrice(pkg.price)}</p>
              </CardHeader>
              <CardContent className="p-6">
                 {/* 
                    Features are stored in features_config in DB which is an object. 
                    We convert it to a list for display.
                 */}
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                     <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isPopular ? "bg-orange text-white" : "bg-sky text-navy"}`}>
                       <Check className="w-3 h-3" />
                     </div>
                     <span className="text-navy">AI check: {pkg.features_config?.ai_limit_per_day || 0} lần/ngày</span>
                  </li>
                   <li className="flex items-center gap-3">
                     <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isPopular ? "bg-orange text-white" : "bg-sky text-navy"}`}>
                       <Check className="w-3 h-3" />
                     </div>
                     <span className="text-navy">Thú cưng tối đa: {pkg.features_config?.max_pets || 1}</span>
                  </li>
                  {pkg.features_config?.priority_support && (
                     <li className="flex items-center gap-3">
                       <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isPopular ? "bg-orange text-white" : "bg-sky text-navy"}`}>
                         <Check className="w-3 h-3" />
                       </div>
                       <span className="text-navy">Hỗ trợ ưu tiên</span>
                    </li>
                  )}
                </ul>
                <Button
                  onClick={() => !current && handleSubscribe(pkg._id)}
                  disabled={current || processingId === pkg._id}
                  className={`w-full mt-6 rounded-xl py-6 font-bold ${
                    isPopular ? "bg-orange hover:bg-orange/90 text-white" : "bg-navy hover:bg-navy/90 text-white"
                  }`}
                >
                  {processingId === pkg._id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : current ? (
                    "Đang sử dụng"
                  ) : (
                    "Nâng cấp ngay"
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Benefits Highlight */}
      <Card className="bg-gradient-to-r from-navy to-blue text-white max-w-4xl mx-auto">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-orange" />
            Tại sao nên nâng cấp?
          </h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-xl bg-white/10">
              <p className="text-3xl mb-2">🔮</p>
              <p className="font-bold">Nút Diệu Kỳ</p>
              <p className="text-sm text-white/70">AI chẩn đoán sức khỏe</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-white/10">
              <p className="text-3xl mb-2">📸</p>
              <p className="font-bold">Full HD</p>
              <p className="text-sm text-white/70">Lưu trữ ảnh chất lượng cao</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-white/10">
              <p className="text-3xl mb-2">🤖</p>
              <p className="font-bold">AI 24/7</p>
              <p className="text-sm text-white/70">Tư vấn mọi lúc mọi nơi</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
