"use client"

import { useState } from "react"
import { useOrders } from "@/lib/hooks"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, Loader2, Clock, CheckCircle2, XCircle, PawPrint, ShoppingBag, Store, MapPin, Truck } from "lucide-react"
import Image from "next/image"

// Order status configuration
const ORDER_STATUSES = [
  { key: "PENDING", label: "Chờ xử lý", icon: Clock, color: "orange" },
  { key: "CONFIRMED", label: "Đã xác nhận", icon: CheckCircle2, color: "cyan" },
  { key: "SHIPPING", label: "Đang giao", icon: Truck, color: "purple" },
  { key: "COMPLETED", label: "Hoàn thành", icon: MapPin, color: "green" },
] as const

const STATUS_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  PENDING: { text: "text-orange-600", bg: "bg-orange-100", border: "border-orange-300" },
  CONFIRMED: { text: "text-cyan-600", bg: "bg-cyan-100", border: "border-cyan-300" },
  SHIPPING: { text: "text-purple-600", bg: "bg-purple-100", border: "border-purple-300" },
  COMPLETED: { text: "text-green-600", bg: "bg-green-100", border: "border-green-300" },
  CANCELLED: { text: "text-red-600", bg: "bg-red-100", border: "border-red-300" },
}

export function OrderTracking() {
  const { data: orders, isLoading } = useOrders()
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  // Get status index for progress calculation
  const getStatusIndex = (status: string) => {
    if (status === "CANCELLED") return -1
    return ORDER_STATUSES.findIndex(s => s.key === status)
  }

  // Filter orders by selected status
  const filteredOrders = !orders ? [] :
    selectedStatus === null ? orders :
      selectedStatus === "CANCELLED" ? orders.filter((o: any) => o.status === "CANCELLED") :
        orders.filter((o: any) => o.status === selectedStatus)

  // Count orders by status
  const statusCounts = orders?.reduce((acc: Record<string, number>, order: any) => {
    acc[order.status] = (acc[order.status] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">📦 Theo dõi đơn hàng</h1>
        <p className="text-foreground/60">Xem trạng thái và tiến trình giao hàng</p>
      </div>

      {/* Status Filter Pills */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedStatus === null ? "default" : "outline"}
          size="sm"
          className="rounded-full"
          onClick={() => setSelectedStatus(null)}
        >
          Tất cả ({orders?.length || 0})
        </Button>
        {ORDER_STATUSES.map((status) => {
          const count = statusCounts[status.key] || 0
          const StatusIcon = status.icon
          return (
            <Button
              key={status.key}
              variant={selectedStatus === status.key ? "default" : "outline"}
              size="sm"
              className={`rounded-full gap-1.5 ${selectedStatus === status.key
                ? ""
                : `${STATUS_COLORS[status.key].text} hover:${STATUS_COLORS[status.key].bg}`
                }`}
              onClick={() => setSelectedStatus(status.key)}
            >
              <StatusIcon className="w-3.5 h-3.5" />
              {status.label} ({count})
            </Button>
          )
        })}
        <Button
          variant={selectedStatus === "CANCELLED" ? "default" : "outline"}
          size="sm"
          className={`rounded-full gap-1.5 ${selectedStatus === "CANCELLED"
            ? ""
            : "text-red-600 hover:bg-red-50"
            }`}
          onClick={() => setSelectedStatus("CANCELLED")}
        >
          <XCircle className="w-3.5 h-3.5" />
          Đã hủy ({statusCounts["CANCELLED"] || 0})
        </Button>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order: any) => (
            <OrderCardWithProgress
              key={order._id}
              order={order}
              formatPrice={formatPrice}
              getStatusIndex={getStatusIndex}
            />
          ))
        ) : (
          <EmptyState
            message={selectedStatus ? `Không có đơn hàng ${ORDER_STATUSES.find(s => s.key === selectedStatus)?.label?.toLowerCase() || "đã hủy"}` : "Bạn chưa có đơn hàng nào"}
          />
        )}
      </div>
    </div>
  )
}

// Order Card with animated progress bar
function OrderCardWithProgress({
  order,
  formatPrice,
  getStatusIndex,
}: {
  order: any
  formatPrice: (price: number) => string
  getStatusIndex: (status: string) => number
}) {
  const currentStatusIndex = getStatusIndex(order.status)
  const isCancelled = order.status === "CANCELLED"

  // Calculate progress percentage (0-100)
  const progressPercent = isCancelled ? 0 : ((currentStatusIndex + 1) / ORDER_STATUSES.length) * 100

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
      <CardContent className="p-0">
        {/* Order Header */}
        <div className="p-4 bg-gradient-to-r from-secondary/50 to-secondary/20 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isCancelled ? STATUS_COLORS.CANCELLED.bg : STATUS_COLORS[order.status]?.bg || "bg-gray-100"
                }`}>
                {isCancelled ? (
                  <XCircle className="w-5 h-5 text-red-600" />
                ) : order.status === "SHIPPING" ? (
                  <Truck className="w-5 h-5 text-purple-600" />
                ) : (
                  <Package className="w-5 h-5 text-foreground/60" />
                )}
              </div>
              <div>
                <p className="font-bold text-foreground">Đơn hàng #{order._id?.slice(-8)}</p>
                <p className="text-sm text-foreground/60">
                  {new Date(order.created_at).toLocaleDateString("vi-VN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
            <Badge className={`${isCancelled ? STATUS_COLORS.CANCELLED.bg + " " + STATUS_COLORS.CANCELLED.text :
              STATUS_COLORS[order.status]?.bg + " " + STATUS_COLORS[order.status]?.text
              } border-0`}>
              {isCancelled ? "Đã hủy" : ORDER_STATUSES.find(s => s.key === order.status)?.label || order.status}
            </Badge>
          </div>
        </div>

        {/* Animated Progress Bar with Truck */}
        {!isCancelled && (
          <div className="px-4 py-5 bg-gradient-to-b from-secondary/10 to-transparent">
            {/* Status Steps */}
            <div className="relative">
              {/* Background Track */}
              <div className="absolute top-4 left-0 right-0 h-1.5 bg-gray-200 rounded-full" />

              {/* Progress Fill */}
              <div
                className="absolute top-4 left-0 h-1.5 bg-gradient-to-r from-orange-400 via-cyan-400 via-purple-400 to-green-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progressPercent}%` }}
              />

              {/* Animated Truck */}
              <div
                className="absolute top-0 -translate-y-0 transition-all duration-1000 ease-out z-10"
                style={{
                  left: `calc(${progressPercent}% - 16px)`,
                }}
              >
                <div className="relative">
                  {/* Paw Container with bounce animation */}
                  <div className="animate-bounce-slow">
                    <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                      <PawPrint className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  {/* Smoke/Dust effect behind truck */}
                  {order.status === "SHIPPING" && (
                    <div className="absolute -left-3 top-3 flex gap-0.5">
                      <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-ping opacity-75" style={{ animationDelay: '0ms' }} />
                      <div className="w-1 h-1 bg-gray-300 rounded-full animate-ping opacity-50" style={{ animationDelay: '200ms' }} />
                      <div className="w-1 h-1 bg-gray-300 rounded-full animate-ping opacity-25" style={{ animationDelay: '400ms' }} />
                    </div>
                  )}
                </div>
              </div>

              {/* Status Points */}
              <div className="flex justify-between relative">
                {ORDER_STATUSES.map((status, index) => {
                  const StatusIcon = status.icon
                  const isCompleted = index <= currentStatusIndex
                  const isCurrent = index === currentStatusIndex

                  return (
                    <div key={status.key} className="flex flex-col items-center">
                      {/* Status Dot */}
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500
                        ${isCompleted
                          ? `${STATUS_COLORS[status.key].bg} ${STATUS_COLORS[status.key].border} ${STATUS_COLORS[status.key].text}`
                          : "bg-gray-100 border-gray-300 text-gray-400"
                        }
                        ${isCurrent ? "ring-4 ring-offset-2 ring-primary/30 scale-110" : ""}
                      `}>
                        <StatusIcon className="w-4 h-4" />
                      </div>
                      {/* Status Label */}
                      <span className={`
                        text-xs mt-2 font-medium text-center max-w-[60px]
                        ${isCompleted ? STATUS_COLORS[status.key].text : "text-gray-400"}
                      `}>
                        {status.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Cancelled State */}
        {isCancelled && (
          <div className="px-4 py-4 bg-red-50">
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Đơn hàng này đã bị hủy</span>
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="p-4 space-y-3">
          {order.items?.length > 0 ? (
            order.items.slice(0, 2).map((item: any, index: number) => (
              <div key={index} className="flex gap-3">
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                  {item.product_image || item.product_id?.images?.[0]?.url ? (
                    <Image
                      src={item.product_image || item.product_id.images[0].url}
                      alt={item.name || item.product_id?.name || "Product"}
                      width={56}
                      height={56}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-5 h-5 text-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground text-sm truncate">
                    {item.name || item.product_id?.name || "Sản phẩm"}
                  </h4>
                  <p className="text-xs text-foreground/60">
                    SL: {item.quantity} × {formatPrice(item.price || 0)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary text-sm">
                    {formatPrice((item.price || 0) * item.quantity)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-foreground/50 text-center py-2">Không có sản phẩm</p>
          )}
          {order.items?.length > 2 && (
            <p className="text-xs text-foreground/50 text-center">
              +{order.items.length - 2} sản phẩm khác
            </p>
          )}
        </div>

        {/* Order Footer */}
        <div className="p-4 bg-secondary/20 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-foreground/60">
              <Store className="w-4 h-4" />
              <span>{order.merchant_id?.merchant_profile?.shop_name || "Cửa hàng"}</span>
            </div>
            <div className="text-right">
              <span className="text-sm text-foreground/60">Tổng cộng:</span>
              <span className="font-bold text-primary text-lg ml-2">
                {formatPrice(order.total_amount)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="bg-secondary/30">
      <CardContent className="p-12 text-center">
        <ShoppingBag className="w-16 h-16 text-foreground/30 mx-auto mb-4" />
        <p className="text-foreground/60">{message}</p>
      </CardContent>
    </Card>
  )
}
