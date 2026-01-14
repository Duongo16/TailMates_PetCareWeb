"use client"

import { useState } from "react"
import { useProducts } from "@/lib/hooks"
import { useCart } from "@/lib/cart-context"
import { ordersAPI } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Star, ShoppingCart, Loader2, Store, Package, Check } from "lucide-react"
import Image from "next/image"
import { AlertDialog, useAlertDialog } from "@/components/ui/alert-dialog-custom"
import { BannerCarousel } from "@/components/ui/banner-carousel"

export function Marketplace() {
  const { addItem } = useCart()
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  const [orderQuantity, setOrderQuantity] = useState(1)
  const [isOrdering, setIsOrdering] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)
  const { alertState, showAlert, closeAlert } = useAlertDialog()

  const { data: products, isLoading: productsLoading } = useProducts()

  const handleAddToCart = (product: any) => {
    addItem({
      product_id: product._id,
      product_name: product.name,
      product_image: product.images?.[0]?.url,
      price: product.price,
      merchant_id: product.merchant_id?._id,
      merchant_name: product.merchant_id?.merchant_profile?.shop_name,
    })
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
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
      const orderData = {
        items: [{
          product_id: selectedProduct._id,
          quantity: orderQuantity,
          product_name: selectedProduct.name,
          price: selectedProduct.price,
          product_image: selectedProduct.images?.[0]?.url,
        }],
        note: `Đặt hàng nhanh từ Marketplace`,
      }

      console.log("🔍 Creating order with data:", orderData)
      console.log("🖼️ Product image URL:", selectedProduct.images?.[0]?.url)

      const res = await ordersAPI.create(orderData)
      if (res.success) {
        setOrderSuccess(true)
        setTimeout(() => {
          setSelectedProduct(null)
          setOrderSuccess(false)
          setOrderQuantity(1)
        }, 2000)
      } else {
        showAlert({
          type: "error",
          title: "Đặt hàng thất bại",
          message: res.message || "Không thể tạo đơn hàng. Vui lòng thử lại.",
        })
      }
    } catch {
      showAlert({
        type: "error",
        title: "Lỗi kết nối",
        message: "Không thể kết nối đến máy chủ. Vui lòng thử lại.",
      })
    } finally {
      setIsOrdering(false)
    }
  }

  if (productsLoading) {
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
          <h1 className="text-2xl font-bold text-navy">Cửa hàng 🛍️</h1>
          <p className="text-navy/60">Sản phẩm cho bé cưng</p>
        </div>

      </div>

      {/* Added to Cart Toast */}
      {addedToCart && (
        <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-right">
          <Card className="bg-green-600 border-green-700 shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 text-white">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold">Đã thêm vào giỏ hàng!</p>
                  <p className="text-sm text-white/80">Kiểm tra giỏ hàng ở góc trên</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Banner Carousel */}
      <BannerCarousel location="SHOP" />

      {/* All Products */}
      <div>
        <h3 className="font-bold text-navy mb-3">Tất cả sản phẩm</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {products?.products?.map((product: any) => (
            <ProductCard
              key={product._id}
              product={product}
              onAddToCart={handleAddToCart}
              formatPrice={formatPrice}
              onView={() => setSelectedProduct(product)}
            />
          ))}
        </div>
      </div>

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
                    handleAddToCart(selectedProduct)
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

      {/* Alert Dialog */}
      <AlertDialog
        open={alertState.open}
        onOpenChange={closeAlert}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        confirmText={alertState.confirmText}
        onConfirm={alertState.onConfirm}
        showCancel={alertState.showCancel}
      />
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
  onAddToCart: (product: any) => void
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
              onAddToCart(product)
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
