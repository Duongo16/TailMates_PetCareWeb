"use client"

import { useOrders } from "@/lib/hooks"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Package, Loader2, Clock, CheckCircle2, XCircle, Truck, ShoppingBag } from "lucide-react"
import Image from "next/image"

export function OrderTracking() {
  const { data: orders, isLoading } = useOrders()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; icon: any; bgColor: string }> = {
      PENDING: {
        label: "Chờ xử lý",
        color: "text-orange-700",
        bgColor: "bg-orange-100",
        icon: Clock,
      },
      CONFIRMED: {
        label: "Đã xác nhận",
        color: "text-cyan-700",
        bgColor: "bg-cyan-100",
        icon: CheckCircle2,
      },
      PROCESSING: {
        label: "Đang xử lý",
        color: "text-blue-700",
        bgColor: "bg-blue-100",
        icon: Package,
      },
      SHIPPING: {
        label: "Đang giao hàng",
        color: "text-purple-700",
        bgColor: "bg-purple-100",
        icon: Truck,
      },
      COMPLETED: {
        label: "Hoàn thành",
        color: "text-green-700",
        bgColor: "bg-green-100",
        icon: CheckCircle2,
      },
      CANCELLED: {
        label: "Đã hủy",
        color: "text-red-700",
        bgColor: "bg-red-100",
        icon: XCircle,
      },
    }
    return statusMap[status] || statusMap.PENDING
  }

  const filterOrdersByStatus = (status?: string) => {
    if (!orders) return []
    if (!status) return orders
    return orders.filter((order: any) => order.status === status)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const activeOrders = filterOrdersByStatus().filter(
    (o: any) => o.status !== "COMPLETED" && o.status !== "CANCELLED"
  )
  const completedOrders = filterOrdersByStatus("COMPLETED")
  const cancelledOrders = filterOrdersByStatus("CANCELLED")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Đơn hàng của tôi</h1>
        <p className="text-foreground/60">Theo dõi trạng thái đơn hàng</p>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="w-full bg-card rounded-xl p-1">
          <TabsTrigger
            value="active"
            className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Đang xử lý ({activeOrders.length})
          </TabsTrigger>
          <TabsTrigger
            value="completed"
            className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Hoàn thành ({completedOrders.length})
          </TabsTrigger>
          <TabsTrigger
            value="cancelled"
            className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Đã hủy ({cancelledOrders.length})
          </TabsTrigger>
        </TabsList>

        {/* Active Orders */}
        <TabsContent value="active" className="mt-4 space-y-4">
          {activeOrders.length > 0 ? (
            activeOrders.map((order: any) => <OrderCard key={order._id} order={order} formatPrice={formatPrice} getStatusInfo={getStatusInfo} />)
          ) : (
            <EmptyState message="Không có đơn hàng đang xử lý" />
          )}
        </TabsContent>

        {/* Completed Orders */}
        <TabsContent value="completed" className="mt-4 space-y-4">
          {completedOrders.length > 0 ? (
            completedOrders.map((order: any) => <OrderCard key={order._id} order={order} formatPrice={formatPrice} getStatusInfo={getStatusInfo} />)
          ) : (
            <EmptyState message="Chưa có đơn hàng hoàn thành" />
          )}
        </TabsContent>

        {/* Cancelled Orders */}
        <TabsContent value="cancelled" className="mt-4 space-y-4">
          {cancelledOrders.length > 0 ? (
            cancelledOrders.map((order: any) => <OrderCard key={order._id} order={order} formatPrice={formatPrice} getStatusInfo={getStatusInfo} />)
          ) : (
            <EmptyState message="Không có đơn hàng bị hủy" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function OrderCard({
  order,
  formatPrice,
  getStatusInfo,
}: {
  order: any
  formatPrice: (price: number) => string
  getStatusInfo: (status: string) => { label: string; color: string; icon: any; bgColor: string }
}) {
  const statusInfo = getStatusInfo(order.status)
  const StatusIcon = statusInfo.icon

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        <div className="p-4 bg-secondary/30 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${statusInfo.bgColor} rounded-xl flex items-center justify-center`}>
                <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
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
            <Badge className={`${statusInfo.bgColor} ${statusInfo.color} border-0`}>
              {statusInfo.label}
            </Badge>
          </div>
        </div>

        {/* Order Items */}
        <div className="p-4 space-y-3">
          {order.items?.length > 0 ? (
            order.items.map((item: any, index: number) => (
              <div key={index} className="flex gap-3">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                  {item.product_image || item.product_id?.images?.[0]?.url ? (
                    <Image
                      src={item.product_image || item.product_id.images[0].url}
                      alt={item.name || item.product_id?.name || "Product"}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground truncate">
                    {item.name || item.product_id?.name || "Sản phẩm"}
                  </h4>
                  <p className="text-sm text-foreground/60">
                    Số lượng: {item.quantity} × {formatPrice(item.price || 0)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">
                    {formatPrice((item.price || 0) * item.quantity)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-foreground/50 text-center py-4">Không có sản phẩm</p>
          )}
        </div>

        {/* Order Total */}
        <div className="p-4 bg-secondary/20 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="font-bold text-foreground">Tổng cộng</span>
            <span className="font-bold text-primary text-lg">
              {formatPrice(order.total_amount)}
            </span>
          </div>
          {order.note && (
            <p className="text-sm text-foreground/60 mt-2">
              <span className="font-medium">Ghi chú:</span> {order.note}
            </p>
          )}
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
