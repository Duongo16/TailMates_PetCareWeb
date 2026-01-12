"use client"

import { useState } from "react"
import { useProducts, useServices, usePets, useAIRecommendProducts } from "@/lib/hooks"
import { ordersAPI } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sparkles, Star, ShoppingCart, Calendar, Loader2, Store, Package, Check, X } from "lucide-react"
import Image from "next/image"

export function Marketplace() {
  const [cart, setCart] = useState<string[]>([])
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  const [orderQuantity, setOrderQuantity] = useState(1)
  const [isOrdering, setIsOrdering] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  
  const { data: products, isLoading: productsLoading } = useProducts()
  const { data: services, isLoading: servicesLoading } = useServices()
  const { data: pets } = usePets()
  
  // Use first pet for recommendations for now
  const defaultPet = pets && pets.length > 0 ? pets[0] : null
  const { data: aiRecommendations, isLoading: aiLoading } = useAIRecommendProducts(defaultPet?._id || null)

  const addToCart = (productId: string) => {
    setCart((prev) => [...prev, productId])
    // In a real app, this would call an API or update global cart state
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  const handleOrderNow = async () => {
    if (!selectedProduct) return
    setIsOrdering(true)
    try {
      const res = await ordersAPI.create({
        items: [{ product_id: selectedProduct._id, quantity: orderQuantity }],
        note: `Đặt hàng nhanh từ Marketplace`,
      })
      if (res.success) {
        setOrderSuccess(true)
        setTimeout(() => {
          setSelectedProduct(null)
          setOrderSuccess(false)
          setOrderQuantity(1)
        }, 2000)
      } else {
        alert(res.message || "Lỗi đặt hàng")
      }
    } catch {
      alert("Lỗi đặt hàng")
    } finally {
      setIsOrdering(false)
    }
  }

  if (productsLoading || servicesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 lg:pt-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Mua sắm 🛍️</h1>
          <p className="text-navy/60">Sản phẩm & dịch vụ cho bé cưng</p>
        </div>
        <Button variant="outline" className="relative rounded-xl border-navy bg-transparent">
          <ShoppingCart className="w-5 h-5" />
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-orange text-white text-xs rounded-full flex items-center justify-center">
              {cart.length}
            </span>
          )}
        </Button>
      </div>

      {/* AI Recommendations */}
      {defaultPet && (
        <Card className="bg-gradient-to-r from-sky to-peach border-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-orange" />
              <span className="font-bold text-navy">AI Gợi ý cho {defaultPet.name}</span>
            </div>
            <p className="text-sm text-navy/70">
              Dựa trên thông tin của {defaultPet.name} ({defaultPet.species}, {defaultPet.age_months} tháng), 
              chúng tôi đề xuất các sản phẩm và dịch vụ phù hợp nhất.
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="w-full bg-white rounded-xl p-1">
          <TabsTrigger
            value="products"
            className="flex-1 rounded-lg data-[state=active]:bg-orange data-[state=active]:text-white"
          >
            Sản phẩm
          </TabsTrigger>
          <TabsTrigger
            value="services"
            className="flex-1 rounded-lg data-[state=active]:bg-orange data-[state=active]:text-white"
          >
            Dịch vụ
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-4">
          {/* AI Matched Products */}
          {aiRecommendations && aiRecommendations.products && aiRecommendations.products.length > 0 && (
            <div className="mb-6">
              <h3 className="font-bold text-navy mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange" />
                Đề xuất cho {defaultPet?.name}
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {aiRecommendations.products.map((product: any) => (
                  <ProductCard 
                    key={`rec-${product._id || product.id}`} 
                    product={{...product, aiMatch: true}} 
                    onAddToCart={addToCart} 
                    formatPrice={formatPrice} 
                  />
                ))}
              </div>
            </div>
          )}

          {/* All Products */}
          <div>
            <h3 className="font-bold text-navy mb-3">Tất cả sản phẩm</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {products?.products?.map((product: any) => (
                <ProductCard 
                  key={product._id} 
                  product={product} 
                  onAddToCart={addToCart} 
                  formatPrice={formatPrice}
                  onView={() => setSelectedProduct(product)}
                />
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="services" className="mt-4">
          {/* Recommended Services (Mocking based on pet type for now as backend service recommend endpoint exists but we need to call it if we want strict AI matches) */}
          {/* For simplicity, we just list all services, or filter locally if needed. Backend recommend-services is available but let's stick to listing all for now unless requested */}
          
          <div>
            <h3 className="font-bold text-navy mb-3">Tất cả dịch vụ</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {services?.services?.map((service: any) => (
                <ServiceCard 
                  key={service._id} 
                  service={service} 
                  formatPrice={formatPrice} 
                />
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Product Detail Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="rounded-3xl max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết sản phẩm</DialogTitle>
          </DialogHeader>
          {selectedProduct && !orderSuccess && (
            <div className="space-y-4">
              {/* Product Image */}
              <div className="relative aspect-video bg-secondary rounded-xl overflow-hidden">
                <Image
                  src={selectedProduct.images?.[0]?.url || "/placeholder.svg"}
                  alt={selectedProduct.name}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Product Info */}
              <div>
                <h2 className="text-xl font-bold text-foreground">{selectedProduct.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Star className="w-4 h-4 fill-orange text-orange" />
                  <span className="text-sm text-foreground/60">{selectedProduct.rating || 5.0}</span>
                  <span className="text-sm text-foreground/60">|</span>
                  <span className="text-sm text-foreground/60">Còn {selectedProduct.stock_quantity}</span>
                </div>
              </div>

              <p className="text-2xl font-bold text-primary">{formatPrice(selectedProduct.price)}</p>

              {/* Merchant Info */}
              <div className="p-3 bg-secondary/50 rounded-xl">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-foreground/60" />
                  <span className="font-medium">{selectedProduct.merchant_id?.merchant_profile?.shop_name || "Cửa hàng"}</span>
                </div>
                <p className="text-sm text-foreground/60 mt-1">
                  ★ {selectedProduct.merchant_id?.merchant_profile?.rating || 5.0}
                </p>
              </div>

              {/* Description */}
              {selectedProduct.description && (
                <div>
                  <h4 className="font-bold mb-2">Mô tả</h4>
                  <p className="text-foreground/70">{selectedProduct.description}</p>
                </div>
              )}

              {/* Quantity Selector */}
              <div className="flex items-center gap-4">
                <span className="font-medium">Số lượng:</span>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    className="rounded-full w-8 h-8"
                    onClick={() => setOrderQuantity(Math.max(1, orderQuantity - 1))}
                  >
                    -
                  </Button>
                  <span className="w-8 text-center font-bold">{orderQuantity}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    className="rounded-full w-8 h-8"
                    onClick={() => setOrderQuantity(Math.min(selectedProduct.stock_quantity, orderQuantity + 1))}
                  >
                    +
                  </Button>
                </div>
                <span className="text-foreground/60">= {formatPrice(selectedProduct.price * orderQuantity)}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => {
                    addToCart(selectedProduct._id)
                    setSelectedProduct(null)
                  }}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Thêm vào giỏ
                </Button>
                <Button
                  className="flex-1 rounded-xl"
                  onClick={handleOrderNow}
                  disabled={isOrdering}
                >
                  {isOrdering ? <Loader2 className="animate-spin" /> : <><Package className="w-4 h-4 mr-2" /> Đặt hàng ngay</>}
                </Button>
              </div>
            </div>
          )}

          {/* Order Success State */}
          {orderSuccess && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Đặt hàng thành công!</h3>
              <p className="text-foreground/60">Chúng tôi sẽ liên hệ với bạn sớm</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ProductCard({
  product,
  onAddToCart,
  formatPrice,
  onView,
}: {
  product: any
  onAddToCart: (id: string) => void
  formatPrice: (price: number) => string
  onView?: () => void
}) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={onView}>
      <CardContent className="p-0">
        <div className="relative aspect-square bg-sky/30">
          <Image 
            src={product.images?.[0]?.url || "/placeholder.svg"} 
            alt={product.name} 
            fill 
            className="object-cover" 
          />
          {product.aiMatch && (
            <Badge className="absolute top-2 right-2 bg-orange text-white">
              <Sparkles className="w-3 h-3 mr-1" />
              AI Match
            </Badge>
          )}
        </div>
        <div className="p-3">
          <h4 className="font-bold text-navy text-sm line-clamp-1">{product.name}</h4>
          <div className="flex items-center gap-1 my-1">
            <Star className="w-3 h-3 fill-orange text-orange" />
            <span className="text-xs text-navy/60">{product.merchant_id?.merchant_profile?.rating || 5.0}</span>
          </div>
          <p className="font-bold text-orange">{formatPrice(product.price)}</p>
          <Button
            onClick={(e) => {
              e.stopPropagation()
              onAddToCart(product._id)
            }}
            size="sm"
            className="w-full mt-2 bg-navy hover:bg-navy/90 text-white rounded-lg"
          >
            Thêm vào giỏ
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ServiceCard({
  service,
  formatPrice,
}: {
  service: any
  formatPrice: (price: number) => string
}) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        <div className="flex">
          <div className="relative w-32 h-32 bg-sky/30">
            <Image 
              src={service.image?.url || "/placeholder.svg"} 
              alt={service.name} 
              fill 
              className="object-cover" 
            />
          </div>
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold text-navy">{service.name}</h4>
                <p className="text-sm text-navy/60">{service.duration_minutes} phút</p>
              </div>
              {service.aiMatch && (
                <Badge className="bg-orange text-white">
                  <Sparkles className="w-3 h-3" />
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 my-2">
              <MapPinIcon className="w-3 h-3 text-navy/60" />
              <span className="text-xs text-navy/60">
                 {service.merchant_id?.merchant_profile?.shop_name || "Phòng khám"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <p className="font-bold text-orange">{formatPrice(service.price_min)}</p>
              <Button size="sm" className="bg-blue hover:bg-blue/90 text-white rounded-lg">
                <Calendar className="w-4 h-4 mr-1" />
                Đặt lịch
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}
