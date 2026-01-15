"use client"

import { useState, useDeferredValue, useMemo } from "react"
import { useProducts } from "@/lib/hooks"
import { useCart } from "@/lib/cart-context"
import { ordersAPI } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Star, ShoppingCart, Loader2, Store, Package, Check, Search, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react"
import Image from "next/image"
import { AlertDialog, useAlertDialog } from "@/components/ui/alert-dialog-custom"
import { BannerCarousel } from "@/components/ui/banner-carousel"

const CATEGORIES = [
  { value: "all", label: "Tất cả danh mục" },
  { value: "FOOD", label: "Thức ăn" },
  { value: "TOY", label: "Đồ chơi" },
  { value: "ACCESSORY", label: "Phụ kiện" },
  { value: "MEDICINE", label: "Thuốc & Y tế" },
  { value: "HYGIENE", label: "Vệ sinh" },
  { value: "OTHER", label: "Khác" },
]

const SORT_OPTIONS = [
  { value: "newest", label: "Mới nhất" },
  { value: "price_asc", label: "Giá thấp → cao" },
  { value: "price_desc", label: "Giá cao → thấp" },
]

const ITEMS_PER_PAGE = 8

export function Marketplace() {
  const { addItem } = useCart()
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  const [orderQuantity, setOrderQuantity] = useState(1)
  const [isOrdering, setIsOrdering] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)
  const { alertState, showAlert, closeAlert } = useAlertDialog()

  // Filter & Pagination States
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [currentPage, setCurrentPage] = useState(1)

  // Debounce search
  const deferredSearch = useDeferredValue(searchTerm)

  const { data: products, isLoading: productsLoading } = useProducts({
    category: selectedCategory === "all" ? undefined : selectedCategory,
    search: deferredSearch || undefined,
    page: currentPage,
    limit: ITEMS_PER_PAGE,
  })

  // Sort products client-side
  const sortedProducts = useMemo(() => {
    if (!products?.products) return []
    const sorted = [...products.products]
    if (sortBy === "price_asc") {
      sorted.sort((a, b) => a.price - b.price)
    } else if (sortBy === "price_desc") {
      sorted.sort((a, b) => b.price - a.price)
    }
    return sorted
  }, [products?.products, sortBy])

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

  // Reset page when filter changes
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setCurrentPage(1)
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const pagination = products?.pagination
  const totalPages = pagination?.total_pages || 1

  return (
    <div className="space-y-4">
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

      {/* Search & Filter */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
          <Input
            placeholder="Tìm kiếm sản phẩm theo tên..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 rounded-xl h-10"
          />
        </div>

        {/* Filter Row - Comboboxes */}
        <div className="flex flex-wrap gap-2">
          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-[180px] rounded-xl h-10">
              <SelectValue placeholder="Danh mục" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort Filter */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px] rounded-xl h-10">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Sắp xếp" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Products Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-navy">
            {selectedCategory === "all" ? "Tất cả sản phẩm" : CATEGORIES.find(c => c.value === selectedCategory)?.label}
            {pagination && <span className="font-normal text-navy/60 ml-2">({pagination.total} sản phẩm)</span>}
          </h3>
        </div>

        {productsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {sortedProducts.map((product: any) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  formatPrice={formatPrice}
                  onView={() => setSelectedProduct(product)}
                />
              ))}
            </div>

            {/* Empty State */}
            {sortedProducts.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto text-foreground/20 mb-4" />
                <p className="text-foreground/60">Không tìm thấy sản phẩm nào</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-lg"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "ghost"}
                        size="sm"
                        className="w-8 h-8 rounded-lg"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-lg"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
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
