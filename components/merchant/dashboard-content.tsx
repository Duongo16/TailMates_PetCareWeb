"use client"

import { useState, useMemo } from "react"
import { useMerchantProducts, useMerchantServices, useOrders, useBookings } from "@/lib/hooks"
import { HEALTH_TAGS, TargetSpecies, LifeStage, BreedSize } from "@/lib/product-constants"
import { merchantAPI, ordersAPI, bookingsAPI } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { ImageUpload } from "@/components/ui/image-upload"
import {
  Calendar,
  QrCode,
  Plus,
  DollarSign,
  Clock,
  CheckCircle2,
  Truck,
  ScanLine,
  TrendingUp,
  Package,
  ShoppingCart,
  Star,
  Edit,
  Trash2,
  Eye,
  Phone,
  MapPin,
  User,
  Loader2,
  XCircle,
} from "lucide-react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts"
import Image from "next/image"

interface MerchantDashboardContentProps {
  activeTab: string
}

const COLORS = ["#F15A29", "#3B6DB3", "#2D3561", "#FAD5C8", "#00C49F", "#FFBB28", "#FF8042"]

export function MerchantDashboardContent({ activeTab }: MerchantDashboardContentProps) {
  const { data: products, isLoading: productsLoading, refetch: refetchProducts } = useMerchantProducts()
  const { data: services, isLoading: servicesLoading, refetch: refetchServices } = useMerchantServices()
  const { data: orders, isLoading: ordersLoading, refetch: refetchOrders } = useOrders()
  const { data: bookings, isLoading: bookingsLoading, refetch: refetchBookings } = useBookings()

  const [scanResult, setScanResult] = useState<string | null>(null)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [showAddService, setShowAddService] = useState(false)
  const [showEditProduct, setShowEditProduct] = useState(false)
  const [showEditService, setShowEditService] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [editingProduct, setEditingProduct] = useState<any | null>(null)
  const [editingService, setEditingService] = useState<any | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form States with image support
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "FOOD",
    price: "",
    stock: "",
    description: "",
    image_url: "",
    image_public_id: "",
    // Specifications for FOOD category
    targetSpecies: "",
    lifeStage: "",
    breedSize: "",
    healthTags: [] as string[],
    protein: "",
    fat: "",
    fiber: "",
    moisture: "",
    calories: "",
    ingredients: "",
    isSterilized: false,
  })
  const [newService, setNewService] = useState({ name: "", category: "spa", price_min: "", price_max: "", duration_minutes: "", description: "", image_url: "", image_public_id: "" })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge className="bg-orange-100 text-orange-700">Chờ xử lý</Badge>
      case "SHIPPING":
        return <Badge className="bg-blue-100 text-blue-700">Đang giao</Badge>
      case "COMPLETED":
      case "DONE": // Handling both if inconsistent
        return <Badge className="bg-green-100 text-green-700">Hoàn thành</Badge>
      case "CONFIRMED":
        return <Badge className="bg-green-100 text-green-700">Đã xác nhận</Badge>
      case "CANCELLED":
        return <Badge className="bg-red-100 text-red-700">Đã hủy</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  // Calculate Stats
  const stats = useMemo(() => {
    const totalRevenue = orders?.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0) || 0
    const pendingOrdersCount = orders?.filter((o: any) => o.status === "PENDING").length || 0
    const upcomingBookingsCount = bookings?.filter((b: any) => ["PENDING", "CONFIRMED"].includes(b.status)).length || 0
    const totalProductsCount = products?.length || 0

    // Chart Data (Mocking days for now based on actual data if dates exist, otherwise random distribution)
    // In real app, we would group orders by date.
    // Let's create a simple 7-day mock based on order created_at if available
    const today = new Date()
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString('vi-VN', { weekday: 'short' });
    })

    // Simple revenue mock distribution for visualization
    const revenueData = last7Days.map(day => ({
      day,
      products: Math.floor(totalRevenue / 7 * (0.8 + Math.random() * 0.4)), // Distribute somewhat randomly
      services: 0 // Service revenue tracking needs booking costs, currently booking model has price in service snapshot?
    }))

    // Category distribution
    const categoryMap: any = {}
    products?.forEach((p: any) => {
      categoryMap[p.category] = (categoryMap[p.category] || 0) + 1
    })
    const categoryData = Object.keys(categoryMap).map((key, index) => ({
      name: key,
      value: categoryMap[key],
      color: COLORS[index % COLORS.length]
    }))

    // Add services to category data
    if (services?.length) {
      categoryData.push({ name: "Dịch vụ", value: services.length, color: COLORS[COLORS.length - 1] })
    }

    return { totalRevenue, pendingOrdersCount, upcomingBookingsCount, totalProductsCount, revenueData, categoryData }
  }, [orders, bookings, products, services])

  const handleAddProduct = async () => {
    setIsSubmitting(true)
    try {
      const productData: any = {
        name: newProduct.name,
        category: newProduct.category,
        price: Number(newProduct.price),
        stock_quantity: Number(newProduct.stock),
        description: newProduct.description,
      }
      if (newProduct.image_url) {
        productData.images = [{ url: newProduct.image_url, public_id: `prod_${Date.now()}` }]
      }
      // Add specifications for FOOD category
      if (newProduct.category === "FOOD") {
        const specifications: any = {}
        if (newProduct.targetSpecies) specifications.targetSpecies = newProduct.targetSpecies
        if (newProduct.lifeStage) specifications.lifeStage = newProduct.lifeStage
        if (newProduct.breedSize) specifications.breedSize = newProduct.breedSize
        if (newProduct.healthTags.length > 0) specifications.healthTags = newProduct.healthTags
        if (newProduct.ingredients) specifications.ingredients = newProduct.ingredients.split(",").map((i: string) => i.trim())
        specifications.isSterilized = newProduct.isSterilized
        // Nutritional info
        const nutritionalInfo: any = {}
        if (newProduct.protein) nutritionalInfo.protein = Number(newProduct.protein)
        if (newProduct.fat) nutritionalInfo.fat = Number(newProduct.fat)
        if (newProduct.fiber) nutritionalInfo.fiber = Number(newProduct.fiber)
        if (newProduct.moisture) nutritionalInfo.moisture = Number(newProduct.moisture)
        if (newProduct.calories) nutritionalInfo.calories = Number(newProduct.calories)
        if (Object.keys(nutritionalInfo).length > 0) specifications.nutritionalInfo = nutritionalInfo
        if (Object.keys(specifications).length > 0) productData.specifications = specifications
      }
      const res = await merchantAPI.createProduct(productData)
      if (res.success) {
        setShowAddProduct(false)
        refetchProducts()
        setNewProduct({
          name: "", category: "FOOD", price: "", stock: "", description: "", image_url: "", image_public_id: "",
          targetSpecies: "", lifeStage: "", breedSize: "", healthTags: [],
          protein: "", fat: "", fiber: "", moisture: "", calories: "", ingredients: "", isSterilized: false,
        })
      } else {
        alert(res.message)
      }
    } catch {
      alert("Lỗi khi tạo sản phẩm")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditProduct = async () => {
    if (!editingProduct) return
    setIsSubmitting(true)
    try {
      const productData: any = {
        name: editingProduct.name,
        category: editingProduct.category,
        price: Number(editingProduct.price),
        stock_quantity: Number(editingProduct.stock_quantity),
        description: editingProduct.description,
      }
      if (editingProduct.image_url) {
        productData.images = [{ url: editingProduct.image_url, public_id: editingProduct.images?.[0]?.public_id || `prod_${Date.now()}` }]
      }
      // Add specifications for FOOD category
      if (editingProduct.category === "FOOD") {
        const specifications: any = {}
        if (editingProduct.targetSpecies) specifications.targetSpecies = editingProduct.targetSpecies
        if (editingProduct.lifeStage) specifications.lifeStage = editingProduct.lifeStage
        if (editingProduct.breedSize) specifications.breedSize = editingProduct.breedSize
        if (editingProduct.healthTags?.length > 0) specifications.healthTags = editingProduct.healthTags
        if (editingProduct.ingredients?.length > 0) specifications.ingredients = editingProduct.ingredients
        specifications.isSterilized = editingProduct.isSterilized || false
        // Nutritional info
        const nutritionalInfo: any = {}
        if (editingProduct.protein) nutritionalInfo.protein = Number(editingProduct.protein)
        if (editingProduct.fat) nutritionalInfo.fat = Number(editingProduct.fat)
        if (editingProduct.fiber) nutritionalInfo.fiber = Number(editingProduct.fiber)
        if (editingProduct.moisture) nutritionalInfo.moisture = Number(editingProduct.moisture)
        if (editingProduct.calories) nutritionalInfo.calories = Number(editingProduct.calories)
        if (Object.keys(nutritionalInfo).length > 0) specifications.nutritionalInfo = nutritionalInfo
        if (Object.keys(specifications).length > 0) productData.specifications = specifications
      }
      const res = await merchantAPI.updateProduct(editingProduct._id, productData)
      if (res.success) {
        setShowEditProduct(false)
        setEditingProduct(null)
        refetchProducts()
      } else {
        alert(res.message)
      }
    } catch {
      alert("Lỗi khi cập nhật sản phẩm")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Bạn có chắc muốn xóa sản phẩm này?")) return
    try {
      const res = await merchantAPI.deleteProduct(productId)
      if (res.success) {
        refetchProducts()
      } else {
        alert(res.message)
      }
    } catch {
      alert("Lỗi khi xóa sản phẩm")
    }
  }

  const openEditProduct = (product: any) => {
    const specs = product.specifications || {}
    setEditingProduct({
      ...product,
      image_url: product.images?.[0]?.url || "",
      // Flatten specifications for form
      targetSpecies: specs.targetSpecies || "",
      lifeStage: specs.lifeStage || "",
      breedSize: specs.breedSize || "",
      healthTags: specs.healthTags || [],
      ingredients: specs.ingredients || [],
      isSterilized: specs.isSterilized || false,
      protein: specs.nutritionalInfo?.protein?.toString() || "",
      fat: specs.nutritionalInfo?.fat?.toString() || "",
      fiber: specs.nutritionalInfo?.fiber?.toString() || "",
      moisture: specs.nutritionalInfo?.moisture?.toString() || "",
      calories: specs.nutritionalInfo?.calories?.toString() || "",
    })
    setShowEditProduct(true)
  }

  const handleAddService = async () => {
    setIsSubmitting(true)
    try {
      const serviceData: any = {
        name: newService.name,
        price_min: Number(newService.price_min),
        price_max: Number(newService.price_max) || Number(newService.price_min),
        duration_minutes: Number(newService.duration_minutes),
        description: newService.description,
      }
      if (newService.image_url) {
        serviceData.image = { url: newService.image_url, public_id: `svc_${Date.now()}` }
      }
      const res = await merchantAPI.createService(serviceData)
      if (res.success) {
        setShowAddService(false)
        refetchServices()
        setNewService({ name: "", category: "spa", price_min: "", price_max: "", duration_minutes: "", description: "", image_url: "", image_public_id: "" })
      } else {
        alert(res.message)
      }
    } catch {
      alert("Lỗi khi tạo dịch vụ")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditService = async () => {
    if (!editingService) return
    setIsSubmitting(true)
    try {
      const serviceData: any = {
        name: editingService.name,
        price_min: Number(editingService.price_min),
        price_max: Number(editingService.price_max) || Number(editingService.price_min),
        duration_minutes: Number(editingService.duration_minutes),
        description: editingService.description,
      }
      if (editingService.image_url) {
        serviceData.image = { url: editingService.image_url, public_id: editingService.image?.public_id || `svc_${Date.now()}` }
      }
      const res = await merchantAPI.updateService(editingService._id, serviceData)
      if (res.success) {
        setShowEditService(false)
        setEditingService(null)
        refetchServices()
      } else {
        alert(res.message)
      }
    } catch {
      alert("Lỗi khi cập nhật dịch vụ")
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditService = (service: any) => {
    setEditingService({
      ...service,
      image_url: service.image?.url || ""
    })
    setShowEditService(true)
  }

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    if (!confirm(`Bạn có chắc muốn chuyển trạng thái đơn hàng sang ${status}?`)) return
    try {
      const res = await ordersAPI.updateStatus(orderId, status)
      if (res.success) {
        refetchOrders()
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder({ ...selectedOrder, status })
        }
      } else {
        alert(res.message)
      }
    } catch {
      alert("Lỗi cập nhật trạng thái")
    }
  }

  const handleUpdateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const res = await bookingsAPI.updateStatus(bookingId, status)
      if (res.success) {
        refetchBookings()
      } else {
        alert(res.message)
      }
    } catch {
      alert("Lỗi cập nhật trạng thái")
    }
  }

  if (activeTab === "dashboard") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Xin chào, Đối tác!</h1>
          <p className="text-foreground/60">Quản lý cửa hàng của bạn</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-foreground/60">Doanh thu</p>
                  <p className="text-xl font-bold text-foreground">{formatPrice(stats.totalRevenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-foreground/60">Đơn chờ xử lý</p>
                  <p className="text-xl font-bold text-foreground">{stats.pendingOrdersCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-foreground/60">Lịch hẹn sắp tới</p>
                  <p className="text-xl font-bold text-foreground">{stats.upcomingBookingsCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <Package className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-foreground/60">Sản phẩm</p>
                  <p className="text-xl font-bold text-foreground">{stats.totalProductsCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Doanh thu 7 ngày qua (Mô phỏng)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.revenueData}>
                    <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} tickFormatter={(value) => `${value / 1000}k`} />
                    <Tooltip
                      formatter={(value: number) => formatPrice(value)}
                      contentStyle={{ background: "white", borderRadius: "0.75rem" }}
                    />
                    <Bar dataKey="products" fill="#F15A29" radius={[4, 4, 0, 0]} name="Doanh thu" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Phân bổ (Sản phẩm & Dịch vụ)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      dataKey="value"
                    >
                      {stats.categoryData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-2">
                {stats.categoryData.map((cat: any) => (
                  <div key={cat.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ background: cat.color }} />
                    <span className="text-sm text-foreground/70">{cat.name} ({cat.value})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle>Đơn hàng gần đây</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {orders?.slice(0, 3).map((order: any) => (
                  <div key={order._id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium text-foreground">{order.customer_id?.full_name || "Khách hàng"}</p>
                        <p className="text-sm text-foreground/60">{new Date(order.created_at).toLocaleDateString("vi-VN")}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{formatPrice(order.total_amount)}</p>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                ))}
                {!orders?.length && <p className="text-center text-foreground/50">Chưa có đơn hàng nào</p>}
              </div>
            </CardContent>
          </Card>

          {/* Recent Bookings */}
          <Card>
            <CardHeader>
              <CardTitle>Lịch hẹn gần đây</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bookings?.slice(0, 3).map((booking: any) => (
                  <div key={booking._id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                    <div>
                      <p className="font-bold text-foreground">{booking.service_id?.name || "Dịch vụ"}</p>
                      <p className="text-sm text-foreground/60">{booking.customer_id?.full_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{new Date(booking.booking_time).toLocaleDateString("vi-VN")}</p>
                      {getStatusBadge(booking.status)}
                    </div>
                  </div>
                ))}
                {!bookings?.length && <p className="text-center text-foreground/50">Chưa có lịch hẹn nào</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Products Tab
  if (activeTab === "products") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Quản lý sản phẩm</h1>
            <p className="text-foreground/60">{products?.length} sản phẩm đang bán</p>
          </div>
          <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
            <DialogTrigger asChild>
              <Button className="rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Thêm sản phẩm
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl max-w-md">
              <DialogHeader>
                <DialogTitle>Thêm sản phẩm mới</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div>
                  <Label>Tên sản phẩm *</Label>
                  <Input
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="Nhập tên sản phẩm"
                    className="rounded-xl mt-1"
                  />
                </div>
                <div>
                  <Label>Danh mục</Label>
                  <Select
                    value={newProduct.category}
                    onValueChange={(val) => setNewProduct({ ...newProduct, category: val })}
                  >
                    <SelectTrigger className="rounded-xl mt-1">
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FOOD">Thức ăn</SelectItem>
                      <SelectItem value="TOY">Đồ chơi</SelectItem>
                      <SelectItem value="ACCESSORY">Phụ kiện</SelectItem>
                      <SelectItem value="MEDICINE">Thuốc & Y tế</SelectItem>
                      <SelectItem value="HYGIENE">Vệ sinh</SelectItem>
                      <SelectItem value="OTHER">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Giá (VND) *</Label>
                    <Input
                      type="number"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      placeholder="0"
                      className="rounded-xl mt-1"
                    />
                  </div>
                  <div>
                    <Label>Số lượng kho</Label>
                    <Input
                      type="number"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                      placeholder="0"
                      className="rounded-xl mt-1"
                    />
                  </div>
                </div>
                <ImageUpload
                  label="Hình ảnh sản phẩm"
                  value={newProduct.image_url ? { url: newProduct.image_url, public_id: newProduct.image_public_id } : null}
                  onChange={(image) => {
                    setNewProduct({
                      ...newProduct,
                      image_url: image?.url || "",
                      image_public_id: image?.public_id || ""
                    })
                  }}
                />
                <div>
                  <Label>Mô tả</Label>
                  <Textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    placeholder="Mô tả sản phẩm..."
                    className="rounded-xl mt-1"
                    rows={3}
                  />
                </div>
                {/* Specifications Section for FOOD */}
                {newProduct.category === "FOOD" && (
                  <div className="border-t pt-4 mt-4 space-y-4">
                    <h4 className="font-semibold text-sm text-foreground/80">📋 Thông tin chi tiết & Dinh dưỡng</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">Loài</Label>
                        <Select value={newProduct.targetSpecies} onValueChange={(val) => setNewProduct({ ...newProduct, targetSpecies: val })}>
                          <SelectTrigger className="rounded-lg mt-1 h-9"><SelectValue placeholder="Chọn" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DOG">🐕 Chó</SelectItem>
                            <SelectItem value="CAT">🐱 Mèo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Độ tuổi</Label>
                        <Select value={newProduct.lifeStage} onValueChange={(val) => setNewProduct({ ...newProduct, lifeStage: val })}>
                          <SelectTrigger className="rounded-lg mt-1 h-9"><SelectValue placeholder="Chọn" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="KITTEN_PUPPY">Con nhỏ</SelectItem>
                            <SelectItem value="ADULT">Trưởng thành</SelectItem>
                            <SelectItem value="SENIOR">Lớn tuổi</SelectItem>
                            <SelectItem value="ALL_STAGES">Mọi độ tuổi</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Kích cỡ</Label>
                        <Select value={newProduct.breedSize} onValueChange={(val) => setNewProduct({ ...newProduct, breedSize: val })}>
                          <SelectTrigger className="rounded-lg mt-1 h-9"><SelectValue placeholder="Chọn" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SMALL">Nhỏ</SelectItem>
                            <SelectItem value="MEDIUM">Vừa</SelectItem>
                            <SelectItem value="LARGE">Lớn</SelectItem>
                            <SelectItem value="GIANT">Khổng lồ</SelectItem>
                            <SelectItem value="ALL_SIZES">Mọi kích cỡ</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Lợi ích sức khỏe</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {HEALTH_TAGS.map((tag) => (
                          <Badge
                            key={tag}
                            variant={newProduct.healthTags.includes(tag) ? "default" : "outline"}
                            className="cursor-pointer text-xs"
                            onClick={() => {
                              if (newProduct.healthTags.includes(tag)) {
                                setNewProduct({ ...newProduct, healthTags: newProduct.healthTags.filter((t: string) => t !== tag) })
                              } else {
                                setNewProduct({ ...newProduct, healthTags: [...newProduct.healthTags, tag] })
                              }
                            }}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Thành phần (cách nhau bằng dấu phẩy)</Label>
                      <Input
                        value={newProduct.ingredients}
                        onChange={(e) => setNewProduct({ ...newProduct, ingredients: e.target.value })}
                        placeholder="Gà, gạo, cá hồi..."
                        className="rounded-lg mt-1 h-9"
                      />
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      <div>
                        <Label className="text-xs">Protein %</Label>
                        <Input type="number" value={newProduct.protein} onChange={(e) => setNewProduct({ ...newProduct, protein: e.target.value })} className="rounded-lg mt-1 h-9" />
                      </div>
                      <div>
                        <Label className="text-xs">Fat %</Label>
                        <Input type="number" value={newProduct.fat} onChange={(e) => setNewProduct({ ...newProduct, fat: e.target.value })} className="rounded-lg mt-1 h-9" />
                      </div>
                      <div>
                        <Label className="text-xs">Fiber %</Label>
                        <Input type="number" value={newProduct.fiber} onChange={(e) => setNewProduct({ ...newProduct, fiber: e.target.value })} className="rounded-lg mt-1 h-9" />
                      </div>
                      <div>
                        <Label className="text-xs">Moisture %</Label>
                        <Input type="number" value={newProduct.moisture} onChange={(e) => setNewProduct({ ...newProduct, moisture: e.target.value })} className="rounded-lg mt-1 h-9" />
                      </div>
                      <div>
                        <Label className="text-xs">Kcal/kg</Label>
                        <Input type="number" value={newProduct.calories} onChange={(e) => setNewProduct({ ...newProduct, calories: e.target.value })} className="rounded-lg mt-1 h-9" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="newIsSterilized"
                        checked={newProduct.isSterilized}
                        onChange={(e) => setNewProduct({ ...newProduct, isSterilized: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="newIsSterilized" className="text-xs">Dành cho thú đã triệt sản</Label>
                    </div>
                  </div>
                )}
                <Button
                  className="w-full rounded-xl"
                  onClick={handleAddProduct}
                  disabled={isSubmitting || !newProduct.name || !newProduct.price}
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "Lưu sản phẩm"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Product Dialog */}
        <Dialog open={showEditProduct} onOpenChange={setShowEditProduct}>
          <DialogContent className="rounded-3xl max-w-md">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa sản phẩm</DialogTitle>
            </DialogHeader>
            {editingProduct && (
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div>
                  <Label>Tên sản phẩm *</Label>
                  <Input
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="rounded-xl mt-1"
                  />
                </div>
                <div>
                  <Label>Danh mục</Label>
                  <Select
                    value={editingProduct.category}
                    onValueChange={(val) => setEditingProduct({ ...editingProduct, category: val })}
                  >
                    <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FOOD">Thức ăn</SelectItem>
                      <SelectItem value="TOY">Đồ chơi</SelectItem>
                      <SelectItem value="ACCESSORY">Phụ kiện</SelectItem>
                      <SelectItem value="MEDICINE">Thuốc & Y tế</SelectItem>
                      <SelectItem value="HYGIENE">Vệ sinh</SelectItem>
                      <SelectItem value="OTHER">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Giá (VND) *</Label>
                    <Input
                      type="number"
                      value={editingProduct.price}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                      className="rounded-xl mt-1"
                    />
                  </div>
                  <div>
                    <Label>Số lượng kho</Label>
                    <Input
                      type="number"
                      value={editingProduct.stock_quantity}
                      onChange={(e) => setEditingProduct({ ...editingProduct, stock_quantity: e.target.value })}
                      className="rounded-xl mt-1"
                    />
                  </div>
                </div>
                <ImageUpload
                  label="Hình ảnh sản phẩm"
                  value={editingProduct.image_url ? { url: editingProduct.image_url, public_id: editingProduct.images?.[0]?.public_id || "" } : null}
                  onChange={(image) => {
                    setEditingProduct({
                      ...editingProduct,
                      image_url: image?.url || "",
                      image_public_id: image?.public_id || ""
                    })
                  }}
                />
                <div>
                  <Label>Mô tả</Label>
                  <Textarea
                    value={editingProduct.description || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    className="rounded-xl mt-1"
                    rows={3}
                  />
                </div>
                {/* Specifications Section for FOOD */}
                {editingProduct.category === "FOOD" && (
                  <div className="border-t pt-4 mt-4 space-y-4">
                    <h4 className="font-semibold text-sm text-foreground/80">📋 Thông tin chi tiết & Dinh dưỡng</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">Loài</Label>
                        <Select value={editingProduct.targetSpecies || ""} onValueChange={(val) => setEditingProduct({ ...editingProduct, targetSpecies: val })}>
                          <SelectTrigger className="rounded-lg mt-1 h-9"><SelectValue placeholder="Chọn" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DOG">🐕 Chó</SelectItem>
                            <SelectItem value="CAT">🐱 Mèo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Độ tuổi</Label>
                        <Select value={editingProduct.lifeStage || ""} onValueChange={(val) => setEditingProduct({ ...editingProduct, lifeStage: val })}>
                          <SelectTrigger className="rounded-lg mt-1 h-9"><SelectValue placeholder="Chọn" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="KITTEN_PUPPY">Con nhỏ</SelectItem>
                            <SelectItem value="ADULT">Trưởng thành</SelectItem>
                            <SelectItem value="SENIOR">Lớn tuổi</SelectItem>
                            <SelectItem value="ALL_STAGES">Mọi độ tuổi</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Kích cỡ</Label>
                        <Select value={editingProduct.breedSize || ""} onValueChange={(val) => setEditingProduct({ ...editingProduct, breedSize: val })}>
                          <SelectTrigger className="rounded-lg mt-1 h-9"><SelectValue placeholder="Chọn" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SMALL">Nhỏ</SelectItem>
                            <SelectItem value="MEDIUM">Vừa</SelectItem>
                            <SelectItem value="LARGE">Lớn</SelectItem>
                            <SelectItem value="GIANT">Khổng lồ</SelectItem>
                            <SelectItem value="ALL_SIZES">Mọi kích cỡ</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Lợi ích sức khỏe</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {HEALTH_TAGS.map((tag) => (
                          <Badge
                            key={tag}
                            variant={editingProduct.healthTags?.includes(tag) ? "default" : "outline"}
                            className="cursor-pointer text-xs"
                            onClick={() => {
                              const currentTags = editingProduct.healthTags || []
                              if (currentTags.includes(tag)) {
                                setEditingProduct({ ...editingProduct, healthTags: currentTags.filter((t: string) => t !== tag) })
                              } else {
                                setEditingProduct({ ...editingProduct, healthTags: [...currentTags, tag] })
                              }
                            }}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Thành phần</Label>
                      <Input
                        value={Array.isArray(editingProduct.ingredients) ? editingProduct.ingredients.join(", ") : ""}
                        onChange={(e) => setEditingProduct({ ...editingProduct, ingredients: e.target.value.split(",").map((s: string) => s.trim()) })}
                        placeholder="Gà, gạo, cá hồi..."
                        className="rounded-lg mt-1 h-9"
                      />
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      <div>
                        <Label className="text-xs">Protein %</Label>
                        <Input type="number" value={editingProduct.protein || ""} onChange={(e) => setEditingProduct({ ...editingProduct, protein: e.target.value })} className="rounded-lg mt-1 h-9" />
                      </div>
                      <div>
                        <Label className="text-xs">Fat %</Label>
                        <Input type="number" value={editingProduct.fat || ""} onChange={(e) => setEditingProduct({ ...editingProduct, fat: e.target.value })} className="rounded-lg mt-1 h-9" />
                      </div>
                      <div>
                        <Label className="text-xs">Fiber %</Label>
                        <Input type="number" value={editingProduct.fiber || ""} onChange={(e) => setEditingProduct({ ...editingProduct, fiber: e.target.value })} className="rounded-lg mt-1 h-9" />
                      </div>
                      <div>
                        <Label className="text-xs">Moisture %</Label>
                        <Input type="number" value={editingProduct.moisture || ""} onChange={(e) => setEditingProduct({ ...editingProduct, moisture: e.target.value })} className="rounded-lg mt-1 h-9" />
                      </div>
                      <div>
                        <Label className="text-xs">Kcal/kg</Label>
                        <Input type="number" value={editingProduct.calories || ""} onChange={(e) => setEditingProduct({ ...editingProduct, calories: e.target.value })} className="rounded-lg mt-1 h-9" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="editIsSterilized"
                        checked={editingProduct.isSterilized || false}
                        onChange={(e) => setEditingProduct({ ...editingProduct, isSterilized: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="editIsSterilized" className="text-xs">Dành cho thú đã triệt sản</Label>
                    </div>
                  </div>
                )}
                <Button
                  className="w-full rounded-xl"
                  onClick={handleEditProduct}
                  disabled={isSubmitting || !editingProduct.name || !editingProduct.price}
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "Cập nhật"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {productsLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Ảnh</TableHead>
                  <TableHead>Tên sản phẩm</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead className="text-right">Giá</TableHead>
                  <TableHead className="text-center">Kho</TableHead>
                  <TableHead className="text-center">Đã bán</TableHead>
                  <TableHead className="text-center">Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products?.map((product: any) => (
                  <TableRow key={product._id}>
                    <TableCell>
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary">
                        <Image
                          src={product.images?.[0]?.url || "/placeholder.svg"}
                          alt={product.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{product.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      {formatPrice(product.price)}
                    </TableCell>
                    <TableCell className="text-center">{product.stock_quantity}</TableCell>
                    <TableCell className="text-center">{product.sold_quantity || 0}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Switch
                          checked={product.is_active !== false}
                          onCheckedChange={async (checked) => {
                            try {
                              await merchantAPI.updateProduct(product._id, { is_active: checked })
                              refetchProducts()
                            } catch {
                              alert("Lỗi khi cập nhật trạng thái")
                            }
                          }}
                        />
                        <span className={`text-xs ${product.is_active !== false ? "text-green-600" : "text-foreground/50"}`}>
                          {product.is_active !== false ? "Hiển thị" : "Ẩn"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="rounded-lg h-8 w-8"
                          onClick={() => openEditProduct(product)}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          className="rounded-lg h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteProduct(product._id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!products?.length && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-foreground/50">
                      Chưa có sản phẩm nào
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    )
  }

  // Services Tab
  if (activeTab === "services") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Quản lý dịch vụ</h1>
            <p className="text-foreground/60">{services?.length} dịch vụ đang hoạt động</p>
          </div>
          <Dialog open={showAddService} onOpenChange={setShowAddService}>
            <DialogTrigger asChild>
              <Button className="rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Thêm dịch vụ
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl max-w-lg">
              <DialogHeader>
                <DialogTitle>Thêm dịch vụ mới</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div>
                  <Label>Tên dịch vụ *</Label>
                  <Input
                    value={newService.name}
                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                    placeholder="VD: Tắm Spa Cao Cấp"
                    className="rounded-xl mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Giá thấp nhất (VND) *</Label>
                    <Input
                      type="number"
                      value={newService.price_min}
                      onChange={(e) => setNewService({ ...newService, price_min: e.target.value })}
                      placeholder="200000"
                      className="rounded-xl mt-1"
                    />
                  </div>
                  <div>
                    <Label>Giá cao nhất (VND)</Label>
                    <Input
                      type="number"
                      value={newService.price_max}
                      onChange={(e) => setNewService({ ...newService, price_max: e.target.value })}
                      placeholder="350000"
                      className="rounded-xl mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label>Thời gian (phút) *</Label>
                  <Input
                    type="number"
                    value={newService.duration_minutes}
                    onChange={(e) => setNewService({ ...newService, duration_minutes: e.target.value })}
                    placeholder="60"
                    className="rounded-xl mt-1"
                  />
                </div>
                <ImageUpload
                  label="Hình ảnh dịch vụ"
                  value={newService.image_url ? { url: newService.image_url, public_id: newService.image_public_id } : null}
                  onChange={(image) => {
                    setNewService({
                      ...newService,
                      image_url: image?.url || "",
                      image_public_id: image?.public_id || ""
                    })
                  }}
                />
                <div>
                  <Label>Mô tả chi tiết</Label>
                  <Textarea
                    value={newService.description}
                    onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                    placeholder="Mô tả dịch vụ..."
                    className="rounded-xl mt-1"
                    rows={3}
                  />
                </div>
                <Button
                  className="w-full rounded-xl"
                  onClick={handleAddService}
                  disabled={isSubmitting || !newService.name || !newService.price_min}
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "Lưu dịch vụ"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Service Dialog */}
        <Dialog open={showEditService} onOpenChange={setShowEditService}>
          <DialogContent className="rounded-3xl max-w-lg">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa dịch vụ</DialogTitle>
            </DialogHeader>
            {editingService && (
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div>
                  <Label>Tên dịch vụ *</Label>
                  <Input
                    value={editingService.name}
                    onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                    className="rounded-xl mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Giá thấp nhất (VND) *</Label>
                    <Input
                      type="number"
                      value={editingService.price_min}
                      onChange={(e) => setEditingService({ ...editingService, price_min: e.target.value })}
                      className="rounded-xl mt-1"
                    />
                  </div>
                  <div>
                    <Label>Giá cao nhất (VND)</Label>
                    <Input
                      type="number"
                      value={editingService.price_max || ""}
                      onChange={(e) => setEditingService({ ...editingService, price_max: e.target.value })}
                      className="rounded-xl mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label>Thời gian (phút) *</Label>
                  <Input
                    type="number"
                    value={editingService.duration_minutes}
                    onChange={(e) => setEditingService({ ...editingService, duration_minutes: e.target.value })}
                    className="rounded-xl mt-1"
                  />
                </div>
                <ImageUpload
                  label="Hình ảnh dịch vụ"
                  value={editingService.image_url ? { url: editingService.image_url, public_id: editingService.image?.public_id || "" } : null}
                  onChange={(image) => {
                    setEditingService({
                      ...editingService,
                      image_url: image?.url || "",
                      image_public_id: image?.public_id || ""
                    })
                  }}
                />
                <div>
                  <Label>Mô tả chi tiết</Label>
                  <Textarea
                    value={editingService.description || ""}
                    onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                    className="rounded-xl mt-1"
                    rows={3}
                  />
                </div>
                <Button
                  className="w-full rounded-xl"
                  onClick={handleEditService}
                  disabled={isSubmitting || !editingService.name || !editingService.price_min}
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "Cập nhật"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Ảnh</TableHead>
                <TableHead>Tên dịch vụ</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-center">Thời gian</TableHead>
                <TableHead className="text-right">Giá</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services?.map((service: any) => (
                <TableRow key={service._id}>
                  <TableCell>
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary">
                      <Image
                        src={service.image?.url || "/placeholder.svg"}
                        alt={service.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell>
                    <Badge className={service.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                      {service.is_active ? "Hoạt động" : "Tạm ngưng"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">{service.duration_minutes} phút</TableCell>
                  <TableCell className="text-right font-bold text-primary">
                    {formatPrice(service.price_min)}
                    {service.price_max && service.price_max !== service.price_min && (
                      <span className="text-foreground/50 font-normal"> - {formatPrice(service.price_max)}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="rounded-lg h-8 w-8"
                        onClick={() => openEditService(service)}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="rounded-lg h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm("Xóa dịch vụ này?")) {
                            merchantAPI.deleteService(service._id).then(() => refetchServices())
                          }
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!services?.length && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-foreground/50">
                    Chưa có dịch vụ nào
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    )
  }

  // Orders Tab
  if (activeTab === "orders") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Đơn hàng</h1>
            <p className="text-foreground/60">{orders?.length} đơn hàng</p>
          </div>
        </div>

        <Tabs defaultValue="all">
          <TabsList className="bg-card rounded-xl">
            <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Tất cả</TabsTrigger>
            <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Chờ xử lý</TabsTrigger>
            <TabsTrigger value="shipping" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Đang giao</TabsTrigger>
            <TabsTrigger value="done" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Hoàn thành</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4 space-y-4">
            {/* Filter orders based on tab logic if needed, but for "all" we show all. 
                For specific tabs we would filter. Here we just show all for simplicity or duplicate the list with filter */}
            {orders?.map((order: any) => (
              <Card
                key={order._id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedOrder(order)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Icon based on status */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-secondary`}>
                        <Package className="w-6 h-6 text-foreground/60" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">#{order._id.slice(-6).toUpperCase()}</p>
                        <p className="text-sm text-foreground/60">{order.customer_id?.full_name}</p>
                        <p className="text-sm text-foreground/80">
                          Total items: {order.items.length}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(order.status)}
                      <p className="font-bold text-primary mt-2">{formatPrice(order.total_amount)}</p>
                      <p className="text-xs text-foreground/50">{new Date(order.created_at).toLocaleDateString("vi-VN")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          {/* We can implement other tab contents similarly by filtering `orders` */}
          <TabsContent value="pending" className="mt-4 space-y-4">
            {orders?.filter((o: any) => o.status === 'PENDING').map((order: any) => (
              // Duplicate card code or componentize it ideally
              <Card key={order._id} className="cursor-pointer" onClick={() => setSelectedOrder(order)}>
                <CardContent className="p-4 flex justify-between items-center">
                  <div>#{order._id.slice(-6)} - {order.customer_id?.full_name}</div>
                  {getStatusBadge(order.status)}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          {/* ... other tabs ... */}
        </Tabs>

        {/* Order Detail Modal */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="rounded-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Chi tiết đơn hàng #{selectedOrder?._id.slice(-6).toUpperCase()}</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  {getStatusBadge(selectedOrder.status)}
                  <span className="text-sm text-foreground/60">{new Date(selectedOrder.created_at).toLocaleString("vi-VN")}</span>
                </div>

                <Card className="bg-secondary/30">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-foreground/60" />
                      <span className="font-medium">{selectedOrder.customer_id?.full_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-foreground/60" />
                      <span>{selectedOrder.customer_id?.phone_number}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-foreground/60" />
                      <span>{selectedOrder.shipping_address || "Tại cửa hàng"}</span>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-2">
                  {selectedOrder.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between py-2 border-b">
                      <span>{item.name} x{item.quantity}</span>
                      <span>{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between font-bold text-lg">
                  <span>Tổng cộng</span>
                  <span className="text-primary">{formatPrice(selectedOrder.total_amount)}</span>
                </div>

                {selectedOrder.status === "PENDING" && (
                  <div className="flex gap-2">
                    <Button className="flex-1 rounded-xl" onClick={() => handleUpdateOrderStatus(selectedOrder._id, "CONFIRMED")}>
                      Xác nhận đơn
                    </Button>
                    <Button variant="outline" className="flex-1 rounded-xl bg-transparent" onClick={() => handleUpdateOrderStatus(selectedOrder._id, "CANCELLED")}>
                      Từ chối
                    </Button>
                  </div>
                )}
                {selectedOrder.status === "CONFIRMED" && (
                  <Button className="w-full rounded-xl" onClick={() => handleUpdateOrderStatus(selectedOrder._id, "SHIPPING")}>
                    Tiến hành giao hang
                  </Button>
                )}
                {selectedOrder.status === "SHIPPING" && (
                  <Button className="w-full rounded-xl bg-green-600 hover:bg-green-700" onClick={() => handleUpdateOrderStatus(selectedOrder._id, "COMPLETED")}>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Xác nhận giao thành công
                  </Button>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Bookings Tab
  if (activeTab === "bookings") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lịch hẹn</h1>
          <p className="text-foreground/60">{bookings?.length} lịch hẹn</p>
        </div>

        <div className="space-y-4">
          {bookings?.map((booking: any) => (
            <Card key={booking._id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{booking.service_id?.name || "Dịch vụ"}</p>
                      <p className="text-sm text-foreground/60">
                        {booking.customer_id?.full_name} - {booking.customer_id?.phone_number}
                      </p>
                      <p className="text-sm text-foreground/80">Thú cưng: {booking.pet_id?.name}</p>
                      <p className="text-xs text-foreground/50 mt-1">Ghi chú: {booking.note || "Không có"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(booking.status)}
                    <p className="font-bold text-foreground mt-2">
                      {new Date(booking.booking_time).toLocaleString("vi-VN")}
                    </p>
                    {booking.status === "PENDING" && (
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" className="rounded-lg" onClick={() => handleUpdateBookingStatus(booking._id, "CONFIRMED")}>
                          Xác nhận
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-lg bg-transparent" onClick={() => handleUpdateBookingStatus(booking._id, "CANCELLED")}>
                          Từ chối
                        </Button>
                      </div>
                    )}
                    {booking.status === "CONFIRMED" && (
                      <Button size="sm" variant="ghost" className="mt-2 text-green-600" onClick={() => handleUpdateBookingStatus(booking._id, "COMPLETED")}>
                        Hoàn thành
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {!bookings?.length && <p className="text-center text-foreground/50 py-10">Chưa có lịch hẹn nào</p>}
        </div>
      </div>
    )
  }

  // Scanner Tab (Mock)
  if (activeTab === "scanner") {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Quét QR Khách hàng</h1>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="aspect-video bg-secondary rounded-2xl flex items-center justify-center border-2 border-dashed border-foreground/20">
              <div className="text-center">
                <QrCode className="w-16 h-16 text-foreground/30 mx-auto mb-4" />
                <p className="text-foreground/60">Quét mã QR để xem hồ sơ y tế</p>
              </div>
            </div>
            <Button onClick={() => setScanResult("Mochi - Mèo Anh lông ngắn (Mô phỏng)")} className="w-full rounded-xl py-6">
              <ScanLine className="w-5 h-5 mr-2" />
              Mô phỏng quét QR
            </Button>

            {scanResult && (
              <Card className="bg-secondary">
                <CardContent className="p-4">
                  <h3 className="font-bold text-foreground mb-2">Kết quả quét:</h3>
                  <p className="text-foreground/80">{scanResult}</p>
                  <Button
                    variant="outline"
                    className="mt-3 rounded-xl bg-transparent"
                    onClick={() => setScanResult(null)}
                  >
                    Xem hồ sơ y tế đầy đủ
                  </Button>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Settings Tab
  if (activeTab === "settings") {
    // Dynamically import to avoid circular dependencies
    const { MerchantSettings } = require("./merchant-settings")
    return <MerchantSettings />
  }

  // Medical Records Tab
  if (activeTab === "medical-records") {
    const { MerchantMedicalRecords } = require("./merchant-medical-records")
    return <MerchantMedicalRecords />
  }

  return null
}
