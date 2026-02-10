"use client"

import { useState, useDeferredValue, useMemo } from "react"
import { useProducts } from "@/lib/hooks"
import { useCart } from "@/lib/cart-context"
import { ordersAPI } from "@/lib/api"
import { HEALTH_TAGS } from "@/lib/product-constants"
import { startConversation } from "@/lib/chat-events"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Star, ShoppingCart, Loader2, Store, Package, Check, Search, ChevronLeft, ChevronRight, ArrowUpDown, Filter, ChevronDown, Dog, Cat, Leaf, Sparkles, Bone, Gamepad2, Shirt, HeartPulse, MessageSquare } from "lucide-react"
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
  // Advanced filter states
  const [targetSpecies, setTargetSpecies] = useState("all")
  const [lifeStage, setLifeStage] = useState("all")
  const [selectedHealthTags, setSelectedHealthTags] = useState<string[]>([])
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Debounce search
  const deferredSearch = useDeferredValue(searchTerm)

  const { data: products, isLoading: productsLoading } = useProducts({
    category: selectedCategory === "all" ? undefined : selectedCategory,
    search: deferredSearch || undefined,
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    // Advanced filters
    targetSpecies: targetSpecies && targetSpecies !== "all" ? targetSpecies : undefined,
    lifeStage: lifeStage && lifeStage !== "all" ? lifeStage : undefined,
    healthTags: selectedHealthTags.length > 0 ? selectedHealthTags : undefined,
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

  // Reset advanced filters
  const handleResetAdvancedFilters = () => {
    setTargetSpecies("all")
    setLifeStage("all")
    setSelectedHealthTags([])
    setCurrentPage(1)
  }

  const hasAdvancedFilters = (targetSpecies !== "all") || (lifeStage !== "all") || selectedHealthTags.length > 0

  const pagination = products?.pagination
  const totalPages = pagination?.total_pages || 1

  return (
    <div className="space-y-4">
      {/* Banner - Full Width */}
      <BannerCarousel location="SHOP" />

      {/* AI Product Recommendations - Active Feature */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/10" />
        <CardContent className="p-3 relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-foreground text-sm">Gợi ý sản phẩm AI</h3>
                <Badge variant="secondary" className="bg-green-100 text-green-700 text-[10px] px-1.5 h-5">
                  Mới
                </Badge>
              </div>
              <p className="text-xs text-foreground/60">Gợi ý dựa trên hồ sơ thú cưng</p>
            </div>
          </div>

          {/* Active Feature Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {/* Food */}
            <button
              onClick={() => {
                handleCategoryChange("FOOD")
                setShowAdvancedFilters(true)
              }}
              className="flex flex-col items-center gap-1 p-2 rounded-lg bg-background/70 border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                <Bone className="w-4 h-4 text-orange-600" />
              </div>
              <span className="text-[10px] font-medium text-center hidden sm:block">Thức ăn</span>
            </button>
            {/* Toys */}
            <button
              onClick={() => handleCategoryChange("TOY")}
              className="flex flex-col items-center gap-1 p-2 rounded-lg bg-background/70 border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Gamepad2 className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-[10px] font-medium text-center hidden sm:block">Đồ chơi</span>
            </button>
            {/* Accessories */}
            <button
              onClick={() => handleCategoryChange("ACCESSORY")}
              className="flex flex-col items-center gap-1 p-2 rounded-lg bg-background/70 border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                <Shirt className="w-4 h-4 text-pink-600" />
              </div>
              <span className="text-[10px] font-medium text-center hidden sm:block">Phụ kiện</span>
            </button>
            {/* Health */}
            <button
              onClick={() => handleCategoryChange("MEDICINE")}
              className="flex flex-col items-center gap-1 p-2 rounded-lg bg-background/70 border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <HeartPulse className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-[10px] font-medium text-center hidden sm:block">Sức khỏe</span>
            </button>
          </div>
        </CardContent>
      </Card>

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

          {/* Advanced Filters Toggle */}
          <Button
            variant={showAdvancedFilters || hasAdvancedFilters ? "default" : "outline"}
            className="rounded-xl h-10"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Lọc nâng cao
            {hasAdvancedFilters && <Badge className="ml-2 bg-white text-primary h-5">!</Badge>}
          </Button>
        </div>

        {/* Advanced Filters Section */}
        <Collapsible open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
          <CollapsibleContent className="mt-3">
            <Card className="p-4 bg-secondary/30">
              <div className="space-y-4">
                {/* Species & Life Stage Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs font-medium text-foreground/70 mb-1 block">Đối tượng</label>
                    <Select value={targetSpecies} onValueChange={(val) => { setTargetSpecies(val); setCurrentPage(1) }}>
                      <SelectTrigger className="rounded-lg h-9">
                        <SelectValue placeholder="Loài" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">🐾 Tất cả</SelectItem>
                        <SelectItem value="DOG">🐕 Chó</SelectItem>
                        <SelectItem value="CAT">🐱 Mèo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground/70 mb-1 block">Độ tuổi</label>
                    <Select value={lifeStage} onValueChange={(val) => { setLifeStage(val); setCurrentPage(1) }}>
                      <SelectTrigger className="rounded-lg h-9">
                        <SelectValue placeholder="Độ tuổi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="KITTEN_PUPPY">Con nhỏ</SelectItem>
                        <SelectItem value="ADULT">Trưởng thành</SelectItem>
                        <SelectItem value="SENIOR">Lớn tuổi</SelectItem>
                        <SelectItem value="ALL_STAGES">Mọi độ tuổi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Health Tags */}
                <div>
                  <label className="text-xs font-medium text-foreground/70 mb-2 block">💚 Nhu cầu sức khỏe</label>
                  <div className="flex flex-wrap gap-1.5">
                    {HEALTH_TAGS.map((tag) => (
                      <Badge
                        key={tag}
                        variant={selectedHealthTags.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer text-xs"
                        onClick={() => {
                          if (selectedHealthTags.includes(tag)) {
                            setSelectedHealthTags(selectedHealthTags.filter(t => t !== tag))
                          } else {
                            setSelectedHealthTags([...selectedHealthTags, tag])
                          }
                          setCurrentPage(1)
                        }}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Reset Button */}
                {hasAdvancedFilters && (
                  <Button variant="ghost" size="sm" onClick={handleResetAdvancedFilters} className="text-xs">
                    Xóa bộ lọc
                  </Button>
                )}
              </div>
            </Card>
          </CollapsibleContent>
        </Collapsible>
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

              {selectedProduct.sale_price ? (
                <div className="flex items-end gap-3">
                  <span className="text-3xl font-bold text-red-600">{formatPrice(selectedProduct.sale_price)}</span>
                  <span className="text-lg text-foreground/40 line-through mb-1.5">{formatPrice(selectedProduct.price)}</span>
                  <Badge className="mb-2 bg-red-100 text-red-600 border-red-200">
                    -{Math.round(((selectedProduct.price - selectedProduct.sale_price) / selectedProduct.price) * 100)}%
                  </Badge>
                </div>
              ) : (
                <p className="text-2xl font-bold text-primary">{formatPrice(selectedProduct.price)}</p>
              )}

              {/* Merchant Info */}
              <div className="p-3 bg-secondary/50 rounded-xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-foreground/60" />
                    <span className="font-medium">{selectedProduct.merchant_id?.merchant_profile?.shop_name || "Cửa hàng"}</span>
                  </div>
                  <p className="text-sm text-foreground/60 mt-1">
                    ★ {selectedProduct.merchant_id?.merchant_profile?.rating || 5.0}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl bg-white border-primary/20 text-primary hover:bg-primary hover:text-white font-bold"
                  onClick={() => {
                    const merchantId = selectedProduct.merchant_id?._id || selectedProduct.merchant_id;
                    startConversation({
                      type: 'COMMERCE',
                      participantId: merchantId,
                      contextId: selectedProduct._id,
                      metadata: {
                        title: selectedProduct.merchant_id?.merchant_profile?.shop_name || "Shop",
                        image: selectedProduct.images?.[0]?.url,
                      }
                    });
                  }}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Nhắn tin
                </Button>
              </div>

              {/* Description */}
              {selectedProduct.description && (
                <div>
                  <h4 className="font-bold mb-2">Mô tả</h4>
                  <p className="text-foreground/70">{selectedProduct.description}</p>
                </div>
              )}

              {/* Specifications Display for FOOD products */}
              {selectedProduct.specifications && (
                <div className="space-y-3">
                  {/* Health Tags as Badges */}
                  {selectedProduct.specifications.healthTags?.length > 0 && (
                    <div>
                      <h4 className="font-bold mb-2 text-sm">💚 Lợi ích sức khỏe</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedProduct.specifications.healthTags.map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="bg-green-100 text-green-700 text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Target Info Badges */}
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.specifications.targetSpecies && (
                      <Badge variant="outline" className="text-xs">
                        {selectedProduct.specifications.targetSpecies === "DOG" ? "🐕 Chó" : "🐱 Mèo"}
                      </Badge>
                    )}
                    {selectedProduct.specifications.texture && (
                      <Badge variant="outline" className="text-xs">
                        Kết cấu: {selectedProduct.specifications.texture}
                      </Badge>
                    )}
                    {selectedProduct.specifications.primaryProteinSource && (
                      <Badge variant="outline" className="text-xs">
                        Nguồn Protein: {selectedProduct.specifications.primaryProteinSource}
                      </Badge>
                    )}
                    {selectedProduct.specifications.lifeStage && (
                      <Badge variant="outline" className="text-xs">
                        {selectedProduct.specifications.lifeStage === "KITTEN_PUPPY" ? "Con nhỏ" :
                          selectedProduct.specifications.lifeStage === "ADULT" ? "Trưởng thành" :
                            selectedProduct.specifications.lifeStage === "SENIOR" ? "Lớn tuổi" : "Mọi độ tuổi"}
                      </Badge>
                    )}
                    {selectedProduct.specifications.breedSize && (
                      <Badge variant="outline" className="text-xs">
                        Kích cỡ: {selectedProduct.specifications.breedSize === "SMALL" ? "Nhỏ" :
                          selectedProduct.specifications.breedSize === "MEDIUM" ? "Vừa" :
                            selectedProduct.specifications.breedSize === "LARGE" ? "Lớn" :
                              selectedProduct.specifications.breedSize === "GIANT" ? "Khổng lồ" : "Mọi kích cỡ"}
                      </Badge>
                    )}
                    {selectedProduct.specifications.isSterilized && (
                      <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                        Dành cho thú triệt sản
                      </Badge>
                    )}
                  </div>

                  {/* Nutrition Facts Table */}
                  {selectedProduct.specifications.nutritionalInfo && (
                    <div className="bg-secondary/30 rounded-xl p-3">
                      <h4 className="font-bold mb-2 text-sm">🧪 Thông tin dinh dưỡng</h4>
                      <div className="grid grid-cols-5 gap-2 text-center">
                        {selectedProduct.specifications.nutritionalInfo.protein !== undefined && (
                          <div className="bg-white rounded-lg p-2">
                            <div className="text-lg font-bold text-primary">{selectedProduct.specifications.nutritionalInfo.protein}%</div>
                            <div className="text-xs text-foreground/60">Protein</div>
                          </div>
                        )}
                        {selectedProduct.specifications.nutritionalInfo.fat !== undefined && (
                          <div className="bg-white rounded-lg p-2">
                            <div className="text-lg font-bold text-orange-500">{selectedProduct.specifications.nutritionalInfo.fat}%</div>
                            <div className="text-xs text-foreground/60">Fat</div>
                          </div>
                        )}
                        {selectedProduct.specifications.nutritionalInfo.fiber !== undefined && (
                          <div className="bg-white rounded-lg p-2">
                            <div className="text-lg font-bold text-green-600">{selectedProduct.specifications.nutritionalInfo.fiber}%</div>
                            <div className="text-xs text-foreground/60">Fiber</div>
                          </div>
                        )}
                        {selectedProduct.specifications.nutritionalInfo.moisture !== undefined && (
                          <div className="bg-white rounded-lg p-2">
                            <div className="text-lg font-bold text-blue-500">{selectedProduct.specifications.nutritionalInfo.moisture}%</div>
                            <div className="text-xs text-foreground/60">Moisture</div>
                          </div>
                        )}
                        {selectedProduct.specifications.nutritionalInfo.calories !== undefined && (
                          <div className="bg-white rounded-lg p-2">
                            <div className="text-lg font-bold text-red-500">{selectedProduct.specifications.nutritionalInfo.calories}</div>
                            <div className="text-xs text-foreground/60">kcal/kg</div>
                          </div>
                        )}
                        {selectedProduct.specifications.caloricDensity?.amount && (
                          <div className="bg-white rounded-lg p-2">
                            <div className="text-lg font-bold text-red-500">{selectedProduct.specifications.caloricDensity.amount}</div>
                            <div className="text-xs text-foreground/60">{selectedProduct.specifications.caloricDensity.unit || 'kcal/kg'}</div>
                          </div>
                        )}
                        {selectedProduct.specifications.nutritionalInfo.calcium !== undefined && (
                          <div className="bg-white rounded-lg p-2">
                            <div className="text-lg font-bold text-gray-700">{selectedProduct.specifications.nutritionalInfo.calcium}%</div>
                            <div className="text-xs text-foreground/60">Calcium</div>
                          </div>
                        )}
                        {selectedProduct.specifications.nutritionalInfo.phosphorus !== undefined && (
                          <div className="bg-white rounded-lg p-2">
                            <div className="text-lg font-bold text-gray-700">{selectedProduct.specifications.nutritionalInfo.phosphorus}%</div>
                            <div className="text-xs text-foreground/60">Phosphorus</div>
                          </div>
                        )}
                        {selectedProduct.specifications.nutritionalInfo.taurine !== undefined && (
                          <div className="bg-white rounded-lg p-2">
                            <div className="text-lg font-bold text-gray-700">{selectedProduct.specifications.nutritionalInfo.taurine}%</div>
                            <div className="text-xs text-foreground/60">Taurine</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Ingredients */}
                  {selectedProduct.specifications.ingredients?.length > 0 && (
                    <div>
                      <h4 className="font-bold mb-1 text-sm">🥗 Thành phần</h4>
                      <p className="text-sm text-foreground/70">{selectedProduct.specifications.ingredients.join(", ")}</p>
                    </div>
                  )}
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
                <span className="text-foreground/60">= {formatPrice((selectedProduct.sale_price || selectedProduct.price) * orderQuantity)}</span>
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
          <div className="mt-1">
            {product.sale_price ? (
              <div className="flex items-end gap-2">
                <span className="font-bold text-red-500">{formatPrice(product.sale_price)}</span>
                <span className="text-xs text-foreground/40 line-through mb-0.5">{formatPrice(product.price)}</span>
              </div>
            ) : (
              <p className="font-bold text-orange">{formatPrice(product.price)}</p>
            )}
          </div>
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
