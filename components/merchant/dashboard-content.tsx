"use client"

import React, { useState, useMemo, useEffect } from "react"
import { useMerchantProducts, useMerchantServices, useOrders, useBookings, useMerchantAnalytics } from "@/lib/hooks"
import { HEALTH_TAGS, TargetSpecies, LifeStage, BreedSize, Texture, PrimaryProteinSource } from "@/lib/product-constants"
import { merchantAPI, ordersAPI, bookingsAPI } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
  FileText,
  XCircle,
  Eye,
  Trash2,
  Edit,
  User,
  MapPin,
  Phone,
  Star,
  Loader2,
  Search,
  BarChart as BarChartIcon,
  ChevronLeft,
  ChevronRight,
  Coins,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { TransactionHistory } from "@/components/dashboard/transaction-history"

const MerchantSettings = dynamic(() => import("./merchant-settings").then((mod) => mod.MerchantSettings), {
  loading: () => <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
})
const MerchantMedicalRecords = dynamic(() => import("./merchant-medical-records").then((mod) => mod.MerchantMedicalRecords), {
  loading: () => <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
})
const MerchantAnalyticsComponent = dynamic(() => import("./merchant-analytics").then((mod) => mod.MerchantAnalytics), {
  loading: () => <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
})
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Area, AreaChart, CartesianGrid } from "recharts"
import Image from "next/image"
import { useToast } from "@/components/ui/use-toast"

interface MerchantDashboardContentProps {
  activeTab: string
  setActiveTab: (tab: any) => void
}

const COLORS = ["#F15A29", "#3B6DB3", "#2D3561", "#FAD5C8", "#00C49F", "#FFBB28", "#FF8042"]

export function MerchantDashboardContent({ activeTab, setActiveTab }: MerchantDashboardContentProps): React.ReactNode {
  const { data: products, isLoading: productsLoading, refetch: refetchProducts } = useMerchantProducts()
  const { data: services, isLoading: servicesLoading, refetch: refetchServices } = useMerchantServices()
  const { data: orders, isLoading: ordersLoading, refetch: refetchOrders } = useOrders()
  const { data: bookings, isLoading: bookingsLoading, refetch: refetchBookings } = useBookings()
  const { data: analytics, isLoading: analyticsLoading } = useMerchantAnalytics("30d")
  const { toast } = useToast()
  const { user } = useAuth()
  const router = useRouter()

  const [scanResult, setScanResult] = useState<string | null>(null)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [showAddService, setShowAddService] = useState(false)
  const [showEditProduct, setShowEditProduct] = useState(false)
  const [showEditService, setShowEditService] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [editingProduct, setEditingProduct] = useState<any | null>(null)
  const [editingService, setEditingService] = useState<any | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null)
  const [showBookingDetails, setShowBookingDetails] = useState(false)

  // Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    confirmText?: string;
    variant?: "default" | "destructive";
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => { },
  })

  // Filter States
  const [filterName, setFilterName] = useState("")
  const [filterCategory, setFilterCategory] = useState("ALL")
  const [filterStock, setFilterStock] = useState("ALL")

  // Service Filter States
  const [filterServiceName, setFilterServiceName] = useState("")
  const [filterServiceCategory, setFilterServiceCategory] = useState("ALL")

  // Order & Booking Gradient Filter States
  const [orderFilter, setOrderFilter] = useState("ALL")
  const [bookingFilter, setBookingFilter] = useState("ALL") // "ALL" | "TODAY" | "PENDING" | ...

  const filteredProducts = useMemo(() => {
    if (!products) return []
    return products.filter((product: any) => {
      const matchesName = product.name.toLowerCase().includes(filterName.toLowerCase())
      const matchesCategory = filterCategory === "ALL" || product.category === filterCategory
      const matchesStock = filterStock === "ALL" ||
        (filterStock === "IN_STOCK" && product.stock_quantity > 0) ||
        (filterStock === "OUT_OF_STOCK" && product.stock_quantity === 0)

      return matchesName && matchesCategory && matchesStock
    })
  }, [products, filterName, filterCategory, filterStock])

  // Pagination
  // Pagination
  const ITEMS_PER_PAGE = 6
  const [currentPage, setCurrentPage] = useState(1) // Products
  const [currentServicePage, setCurrentServicePage] = useState(1)
  const [currentOrderPage, setCurrentOrderPage] = useState(1)
  const [currentBookingPage, setCurrentBookingPage] = useState(1)

  const [orderTab, setOrderTab] = useState("all")

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filterName, filterCategory, filterStock])

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredProducts, currentPage])

  const totalPages = Math.ceil((filteredProducts?.length || 0) / ITEMS_PER_PAGE)

  // Services Filtering
  const filteredServices = useMemo(() => {
    if (!services) return []
    return services.filter((service: any) => {
      const matchesName = service.name.toLowerCase().includes(filterServiceName.toLowerCase())
      const matchesCategory = filterServiceCategory === "ALL" || service.category === filterServiceCategory
      return matchesName && matchesCategory
    })
  }, [services, filterServiceName, filterServiceCategory])

  // Reset service pagination when filters change
  useEffect(() => {
    setCurrentServicePage(1)
  }, [filterServiceName, filterServiceCategory])

  // Services Pagination
  const paginatedServices = useMemo(() => {
    const startIndex = (currentServicePage - 1) * ITEMS_PER_PAGE
    return filteredServices.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredServices, currentServicePage])

  const totalServicePages = Math.ceil((filteredServices?.length || 0) / ITEMS_PER_PAGE)

  // Orders Pagination
  useEffect(() => {
    setCurrentOrderPage(1)
  }, [orderFilter])

  const filteredOrders = useMemo(() => {
    if (!orders) return []
    if (orderFilter === "ALL") return orders
    return orders.filter((o: any) => o.status === orderFilter)
  }, [orders, orderFilter])

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentOrderPage - 1) * ITEMS_PER_PAGE
    return filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredOrders, currentOrderPage])

  const totalOrderPages = Math.ceil((filteredOrders?.length || 0) / ITEMS_PER_PAGE)

  // Bookings Filtering
  const filteredBookings = useMemo(() => {
    if (!bookings) return []
    const now = new Date()

    return bookings.filter((b: any) => {
      // Today Filter
      if (bookingFilter === "TODAY") {
        const bookingDate = new Date(b.booking_time)
        return bookingDate.getDate() === now.getDate() &&
          bookingDate.getMonth() === now.getMonth() &&
          bookingDate.getFullYear() === now.getFullYear()
      }

      // Status Filter
      if (bookingFilter !== "ALL") {
        return b.status === bookingFilter
      }

      return true
    })
  }, [bookings, bookingFilter])

  // Bookings Pagination
  const paginatedBookings = useMemo(() => {
    const startIndex = (currentBookingPage - 1) * ITEMS_PER_PAGE
    return filteredBookings.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredBookings, currentBookingPage])

  const totalBookingPages = Math.ceil((filteredBookings?.length || 0) / ITEMS_PER_PAGE)

  // Form States with image support
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "FOOD",
    price: "",
    sale_price: "",
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
    caloric_density_amount: "",
    caloric_density_unit: "kcal/kg",
    texture: "",
    primary_protein_source: "",
    calcium: "",
    phosphorus: "",
    taurine: "",
  })
  const [newService, setNewService] = useState({
    name: "",
    category: "SPA",
    price_min: "",
    price_max: "",
    duration_minutes: "",
    description: "",
    image_url: "",
    image_public_id: ""
  })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  const getStatusBadge = (status: string) => {
    const commonClasses = "border font-medium px-2.5 py-0.5 rounded-full text-xs shadow-sm bg-opacity-50"
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className={`${commonClasses} bg-yellow-50 text-yellow-700 border-yellow-200`}>Chờ xử lý</Badge>
      case "SHIPPING":
        return <Badge variant="outline" className={`${commonClasses} bg-purple-50 text-purple-700 border-purple-200`}>Đang giao</Badge>
      case "COMPLETED":
      case "DONE":
        return <Badge variant="outline" className={`${commonClasses} bg-green-50 text-green-700 border-green-200`}>Hoàn thành</Badge>
      case "CONFIRMED":
        return <Badge variant="outline" className={`${commonClasses} bg-blue-50 text-blue-700 border-blue-200`}>Đã xác nhận</Badge>
      case "CANCELLED":
        return <Badge variant="outline" className={`${commonClasses} bg-red-50 text-red-700 border-red-200`}>Đã hủy</Badge>
      default:
        return <Badge variant="outline" className={`${commonClasses} bg-gray-50 text-gray-700 border-gray-200`}>{status}</Badge>
    }
  }

  // Calculate Stats
  const stats = useMemo(() => {
    const totalRevenue = (analytics?.summary?.totalRevenue ?? orders?.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0)) || 0
    const pendingOrdersCount = orders?.filter((o: any) => o.status === "PENDING").length || 0
    const upcomingBookingsCount = bookings?.filter((b: any) => ["PENDING", "CONFIRMED"].includes(b.status)).length || 0
    const totalProductsCount = products?.length || 0

    // Use analytics chart data if available, fallback to manual 7-day calculation
    let chartData = []

    if (analytics?.chartData) {
      chartData = analytics.chartData.map((item: any) => ({
        day: item.name,
        revenue: item.revenue
      }))
    } else {
      const revenueByDay: Record<string, number> = {}
      const today = new Date()

      for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i)
        const dateStr = d.toLocaleDateString('vi-VN', { weekday: 'short' })
        revenueByDay[dateStr] = 0
      }

      orders?.forEach((order: any) => {
        const orderDate = new Date(order.created_at)
        const dayKey = orderDate.toLocaleDateString('vi-VN', { weekday: 'short' })
        if (revenueByDay[dayKey] !== undefined) {
          revenueByDay[dayKey] += (order.total_amount || 0)
        }
      })

      chartData = Object.keys(revenueByDay).reverse().map(day => ({
        day,
        revenue: revenueByDay[day],
      }))
    }

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

    return { totalRevenue, pendingOrdersCount, upcomingBookingsCount, totalProductsCount, chartData, categoryData }
  }, [orders, bookings, products, services, analytics])

  const handleAddProduct = async () => {
    setIsSubmitting(true)
    try {
      const productData: any = {
        name: newProduct.name,
        category: newProduct.category,
        price: Number(newProduct.price),
        sale_price: newProduct.sale_price ? Number(newProduct.sale_price) : undefined,
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

        // New specification fields
        if (newProduct.texture) specifications.texture = newProduct.texture
        if (newProduct.primary_protein_source) specifications.primaryProteinSource = newProduct.primary_protein_source
        if (newProduct.caloric_density_amount) {
          specifications.caloricDensity = {
            amount: Number(newProduct.caloric_density_amount),
            unit: newProduct.caloric_density_unit
          }
        }

        // Nutritional info
        const nutritionalInfo: any = {}
        if (newProduct.protein) nutritionalInfo.protein = Number(newProduct.protein)
        if (newProduct.fat) nutritionalInfo.fat = Number(newProduct.fat)
        if (newProduct.fiber) nutritionalInfo.fiber = Number(newProduct.fiber)
        if (newProduct.moisture) nutritionalInfo.moisture = Number(newProduct.moisture)
        if (newProduct.calories) nutritionalInfo.calories = Number(newProduct.calories)
        // Extended nutritional info
        if (newProduct.calcium) nutritionalInfo.calcium = Number(newProduct.calcium)
        if (newProduct.phosphorus) nutritionalInfo.phosphorus = Number(newProduct.phosphorus)
        if (newProduct.taurine) nutritionalInfo.taurine = Number(newProduct.taurine)
        if (Object.keys(nutritionalInfo).length > 0) specifications.nutritionalInfo = nutritionalInfo
        if (Object.keys(specifications).length > 0) productData.specifications = specifications
      }
      const res = await merchantAPI.createProduct(productData)
      if (res.success) {
        setShowAddProduct(false)
        refetchProducts()
        setNewProduct({
          name: "", category: "FOOD", price: "", sale_price: "", stock: "", description: "", image_url: "", image_public_id: "",
          targetSpecies: "", lifeStage: "", breedSize: "", healthTags: [],
          protein: "", fat: "", fiber: "", moisture: "", calories: "", ingredients: "", isSterilized: false,
          caloric_density_amount: "", caloric_density_unit: "kcal/kg", texture: "", primary_protein_source: "",
          calcium: "", phosphorus: "", taurine: "",
        })
        toast({
          title: "Thêm sản phẩm thành công",
          description: "Sản phẩm mới đã được thêm vào cửa hàng của bạn.",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: res.message || "Không thể thêm sản phẩm",
        })
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Lỗi hệ thống",
        description: "Đã xảy ra lỗi khi tạo sản phẩm",
      })
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
        sale_price: editingProduct.sale_price ? Number(editingProduct.sale_price) : undefined,
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

        // New specification fields
        if (editingProduct.texture) specifications.texture = editingProduct.texture
        if (editingProduct.primary_protein_source) specifications.primaryProteinSource = editingProduct.primary_protein_source
        if (editingProduct.caloric_density_amount) {
          specifications.caloricDensity = {
            amount: Number(editingProduct.caloric_density_amount),
            unit: editingProduct.caloric_density_unit || "kcal/kg"
          }
        }
        // Nutritional info
        const nutritionalInfo: any = {}
        if (editingProduct.protein) nutritionalInfo.protein = Number(editingProduct.protein)
        if (editingProduct.fat) nutritionalInfo.fat = Number(editingProduct.fat)
        if (editingProduct.fiber) nutritionalInfo.fiber = Number(editingProduct.fiber)
        if (editingProduct.moisture) nutritionalInfo.moisture = Number(editingProduct.moisture)
        if (editingProduct.calories) nutritionalInfo.calories = Number(editingProduct.calories)
        // Extended nutritional info
        if (editingProduct.calcium) nutritionalInfo.calcium = Number(editingProduct.calcium)
        if (editingProduct.phosphorus) nutritionalInfo.phosphorus = Number(editingProduct.phosphorus)
        if (editingProduct.taurine) nutritionalInfo.taurine = Number(editingProduct.taurine)
        if (Object.keys(nutritionalInfo).length > 0) specifications.nutritionalInfo = nutritionalInfo
        if (Object.keys(specifications).length > 0) productData.specifications = specifications
      }
      const res = await merchantAPI.updateProduct(editingProduct._id, productData)
      if (res.success) {
        setShowEditProduct(false)
        setEditingProduct(null)
        refetchProducts()
        toast({
          title: "Cập nhật thành công",
          description: "Thông tin sản phẩm đã được cập nhật.",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: res.message || "Không thể cập nhật sản phẩm",
        })
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Lỗi hệ thống",
        description: "Đã xảy ra lỗi khi cập nhật sản phẩm",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    setConfirmDialog({
      open: true,
      title: "Xóa sản phẩm?",
      description: "Hành động này không thể hoàn tác. Sản phẩm sẽ bị xóa vĩnh viễn khỏi cửa hàng của bạn.",
      confirmText: "Xóa sản phẩm",
      variant: "destructive",
      onConfirm: async () => {
        try {
          const res = await merchantAPI.deleteProduct(productId)
          if (res.success) {
            refetchProducts()
            toast({
              title: "Đã xóa sản phẩm",
              description: "Sản phẩm đã được xóa khỏi cửa hàng.",
            })
          } else {
            toast({
              variant: "destructive",
              title: "Lỗi",
              description: res.message || "Không thể xóa sản phẩm",
            })
          }
        } catch {
          toast({
            variant: "destructive",
            title: "Lỗi hệ thống",
            description: "Đã xảy ra lỗi khi xóa sản phẩm",
          })
        }
      }
    })
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
      // New fields mapping
      texture: specs.texture || "",
      primary_protein_source: specs.primaryProteinSource || "",
      caloric_density_amount: specs.caloricDensity?.amount?.toString() || "",
      caloric_density_unit: specs.caloricDensity?.unit || "kcal/kg",
      calcium: specs.nutritionalInfo?.calcium?.toString() || "",
      phosphorus: specs.nutritionalInfo?.phosphorus?.toString() || "",
      taurine: specs.nutritionalInfo?.taurine?.toString() || "",
    })
    setShowEditProduct(true)
  }

  const handleAddService = async () => {
    setIsSubmitting(true)
    try {
      const serviceData: any = {
        name: newService.name,
        category: newService.category,
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
        setNewService({ name: "", category: "SPA", price_min: "", price_max: "", duration_minutes: "", description: "", image_url: "", image_public_id: "" })
        toast({
          title: "Thành công",
          description: "Dịch vụ mới đã được tạo.",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: res.message || "Không thể tạo dịch vụ",
        })
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Lỗi hệ thống",
        description: "Lỗi khi tạo dịch vụ",
      })
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
        category: editingService.category,
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
        toast({
          title: "Thành công",
          description: "Thông tin dịch vụ đã được cập nhật.",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: res.message || "Không thể cập nhật dịch vụ",
        })
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Lỗi hệ thống",
        description: "Lỗi khi cập nhật dịch vụ",
      })
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
    let statusText = status
    if (status === "CONFIRMED") statusText = "xác nhận"
    if (status === "CANCELLED") statusText = "hủy"
    if (status === "SHIPPING") statusText = "giao hàng"
    if (status === "COMPLETED") statusText = "hoàn thành"

    setConfirmDialog({
      open: true,
      title: "Cập nhật trạng thái?",
      description: `Bạn có chắc muốn chuyển trạng thái đơn hàng sang "${statusText}"?`,
      confirmText: "Xác nhận",
      onConfirm: async () => {
        try {
          const res = await ordersAPI.updateStatus(orderId, status)
          if (res.success) {
            refetchOrders()
            if (selectedOrder && selectedOrder._id === orderId) {
              setSelectedOrder({ ...selectedOrder, status })
            }
            toast({
              title: "Cập nhật thành công",
              description: `Đơn hàng đã được chuyển sang trạng thái ${statusText}.`,
            })
          } else {
            toast({
              variant: "destructive",
              title: "Lỗi",
              description: res.message || "Không thể cập nhật trạng thái",
            })
          }
        } catch {
          toast({
            variant: "destructive",
            title: "Lỗi hệ thống",
            description: "Lỗi cập nhật trạng thái đơn hàng",
          })
        }
      }
    })
  }

  const handleUpdateBookingStatus = async (bookingId: string, status: string) => {
    let statusText = status
    if (status === "CONFIRMED") statusText = "xác nhận"
    if (status === "CANCELLED") statusText = "từ chối"
    if (status === "COMPLETED") statusText = "hoàn thành"

    setConfirmDialog({
      open: true,
      title: "Xác nhận lịch hẹn?",
      description: `Bạn có chắc muốn chuyển trạng thái lịch hẹn sang "${statusText}"?`,
      confirmText: "Xác nhận",
      variant: status === "CANCELLED" ? "destructive" : "default",
      onConfirm: async () => {
        try {
          const res = await bookingsAPI.updateStatus(bookingId, status)
          if (res.success) {
            refetchBookings()
            toast({
              title: "Cập nhật thành công",
              description: `Lịch hẹn đã được ${statusText}.`,
            })
          } else {
            toast({
              variant: "destructive",
              title: "Lỗi",
              description: res.message || "Không thể cập nhật trạng thái",
            })
          }
        } catch {
          toast({
            variant: "destructive",
            title: "Lỗi hệ thống",
            description: "Lỗi cập nhật trạng thái lịch hẹn",
          })
        }
      }
    })
  }

  const renderContent = () => {
    if (activeTab === "dashboard") {
      const greeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return "Chào buổi sáng"
        if (hour < 18) return "Chào buổi chiều"
        return "Chào buổi tối"
      }

      return (
        <div className="space-y-4 px-1 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-primary/10 to-transparent p-4 md:p-6 rounded-3xl border border-primary/10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                {user?.name ? (
                  <span className="text-2xl font-bold">{user.name.charAt(0)}</span>
                ) : (
                  <User className="w-8 h-8" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{greeting()}, {user?.name || "Đối tác"}!</h1>
                <p className="text-foreground/60 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  Hôm nay cửa hàng của bạn đang vận hành rất tốt.
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-1">
            <Card
              className="border-none shadow-sm bg-white/40 backdrop-blur-md transition-all hover:scale-[1.02] hover:shadow-md group cursor-pointer"
              onClick={() => setActiveTab("analytics")}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center transition-transform group-hover:rotate-12">
                    <DollarSign className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest leading-none mb-1">Doanh thu</p>
                    <p className="text-xl font-bold text-foreground">{formatPrice(stats.totalRevenue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card
              className="border-none shadow-sm bg-white/40 backdrop-blur-md transition-all hover:scale-[1.02] hover:shadow-md group cursor-pointer"
              onClick={() => router.push("/top-up")}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center transition-transform group-hover:rotate-12">
                    <Coins className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest leading-none mb-1">Số dư TM</p>
                    <p className="text-xl font-bold text-yellow-600">{(user as any).tm_balance?.toLocaleString() || 0} TM</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card
              className="border-none shadow-sm bg-white/40 backdrop-blur-md transition-all hover:scale-[1.02] hover:shadow-md group cursor-pointer"
              onClick={() => setActiveTab("orders")}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center transition-transform group-hover:rotate-12">
                    <ShoppingCart className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest leading-none mb-1">Đơn chờ</p>
                    <p className="text-xl font-bold text-foreground">{stats.pendingOrdersCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card
              className="border-none shadow-sm bg-white/40 backdrop-blur-md transition-all hover:scale-[1.02] hover:shadow-md group cursor-pointer"
              onClick={() => setActiveTab("bookings")}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center transition-transform group-hover:rotate-12">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest leading-none mb-1">Lịch hẹn</p>
                    <p className="text-xl font-bold text-foreground">{stats.upcomingBookingsCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card
              className="border-none shadow-sm bg-white/40 backdrop-blur-md transition-all hover:scale-[1.02] hover:shadow-md group cursor-pointer"
              onClick={() => setActiveTab("products")}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center transition-transform group-hover:rotate-12">
                    <Package className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest leading-none mb-1">Sản phẩm</p>
                    <p className="text-xl font-bold text-foreground">{stats.totalProductsCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="border-none shadow-sm bg-white/40 backdrop-blur-md overflow-hidden">
              <CardHeader className="py-3 pb-2">
                <CardTitle className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-primary font-bold">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-base">Doanh thu 30 ngày qua</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab("analytics")}
                    className="h-8 rounded-xl gap-2 text-[10px] font-semibold hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    <BarChartIcon className="w-4 h-4" />
                    Chi tiết
                  </Button>
                </CardTitle>
                <CardDescription className="text-[10px]">Thống kê doanh thu 30 ngày gần nhất</CardDescription>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="h-[220px] mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.chartData}>
                      <defs>
                        <linearGradient id="dashboardRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F15A29" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#F15A29" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(value) => `${value / 1000}k`} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                        formatter={(value: number) => [formatPrice(value), "Doanh thu"]}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#F15A29" strokeWidth={3} fillOpacity={1} fill="url(#dashboardRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white/40 backdrop-blur-md overflow-hidden">
              <CardHeader className="py-3 pb-2">
                <CardTitle className="flex items-center gap-2 text-primary font-bold">
                  <Package className="w-5 h-5" />
                  <span className="text-base">Phân bổ ngành hàng</span>
                </CardTitle>
                <CardDescription className="text-[10px]">Tỉ lệ hàng hóa & dịch vụ</CardDescription>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="h-[220px] mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stats.categoryData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2">
                  {stats.categoryData.map((cat: any) => (
                    <div key={cat.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: cat.color }} />
                      <span className="text-xs text-foreground/70 font-semibold">{cat.name} ({cat.value})</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Recent Orders */}
            <Card className="border-none shadow-sm bg-white/40 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                  Đơn hàng gần đây
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {orders?.slice(0, 4).map((order: any) => (
                    <div
                      key={order._id}
                      onClick={() => setSelectedOrder(order)}
                      className="group flex items-center justify-between p-3 rounded-2xl bg-white/50 border border-transparent hover:border-primary/20 hover:shadow-sm transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                          {order.customer_id?.full_name?.charAt(0) || "K"}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate max-w-[120px]">{order.customer_id?.full_name || "Khách hàng"}</p>
                          <p className="text-[10px] text-foreground/50">{new Date(order.created_at).toLocaleDateString("vi-VN")}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-primary">{formatPrice(order.total_amount)}</p>
                        {getStatusBadge(order.status)}
                      </div>
                    </div>
                  ))}
                  {!orders?.length && (
                    <div className="py-10 text-center space-y-2">
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto opacity-50">
                        <ShoppingCart className="w-6 h-6" />
                      </div>
                      <p className="text-foreground/40 text-sm">Chưa có đơn hàng nào</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Bookings */}
            <Card className="border-none shadow-sm bg-white/40 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Lịch hẹn gần đây
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {bookings?.slice(0, 4).map((booking: any) => (
                    <div
                      key={booking._id}
                      onClick={() => { setSelectedBooking(booking); setShowBookingDetails(true); }}
                      className="group flex items-center justify-between p-3 rounded-2xl bg-white/50 border border-transparent hover:border-primary/20 hover:shadow-sm transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate max-w-[120px]">{booking.service_id?.name || "Dịch vụ"}</p>
                          <p className="text-[10px] text-foreground/50">{booking.customer_id?.full_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">{new Date(booking.booking_time).toLocaleDateString("vi-VN")}</p>
                        {getStatusBadge(booking.status)}
                      </div>
                    </div>
                  ))}
                  {!bookings?.length && (
                    <div className="py-10 text-center space-y-2">
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto opacity-50">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <p className="text-foreground/40 text-sm">Chưa có lịch hẹn nào</p>
                    </div>
                  )}
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
        <div className="space-y-4 p-1">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Quản lý sản phẩm</h1>
              <p className="text-foreground/60">{filteredProducts?.length || 0} / {products?.length || 0} sản phẩm</p>
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
                      <Label>Giá khuyến mãi (VND)</Label>
                      <Input
                        type="number"
                        value={newProduct.sale_price}
                        onChange={(e) => setNewProduct({ ...newProduct, sale_price: e.target.value })}
                        placeholder="0 (Tuỳ chọn)"
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

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Kết cấu (Texture)</Label>
                          <Select value={newProduct.texture} onValueChange={(val) => setNewProduct({ ...newProduct, texture: val })}>
                            <SelectTrigger className="rounded-lg mt-1 h-9"><SelectValue placeholder="Chọn kết cấu" /></SelectTrigger>
                            <SelectContent>
                              {Object.values(Texture).map((t) => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Nguồn Protein chính</Label>
                          <Select value={newProduct.primary_protein_source} onValueChange={(val) => setNewProduct({ ...newProduct, primary_protein_source: val })}>
                            <SelectTrigger className="rounded-lg mt-1 h-9"><SelectValue placeholder="Chọn nguồn protein" /></SelectTrigger>
                            <SelectContent>
                              {Object.values(PrimaryProteinSource).map((p) => (
                                <SelectItem key={p} value={p}>{p}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Mật độ năng lượng (Amount)</Label>
                          <Input
                            type="number"
                            value={newProduct.caloric_density_amount}
                            onChange={(e) => setNewProduct({ ...newProduct, caloric_density_amount: e.target.value })}
                            placeholder="3500"
                            className="rounded-lg mt-1 h-9"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Đơn vị (Unit)</Label>
                          <Select value={newProduct.caloric_density_unit} onValueChange={(val) => setNewProduct({ ...newProduct, caloric_density_unit: val })}>
                            <SelectTrigger className="rounded-lg mt-1 h-9"><SelectValue placeholder="Đơn vị" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="kcal/kg">kcal/kg</SelectItem>
                              <SelectItem value="kcal/cup">kcal/cup</SelectItem>
                              <SelectItem value="kcal/100g">kcal/100g</SelectItem>
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
                      <div className="grid grid-cols-4 gap-2">
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
                          <Label className="text-xs">Calories (Legacy)</Label>
                          <Input type="number" value={newProduct.calories} onChange={(e) => setNewProduct({ ...newProduct, calories: e.target.value })} className="rounded-lg mt-1 h-9" />
                        </div>
                        <div>
                          <Label className="text-xs">Calcium %</Label>
                          <Input type="number" value={newProduct.calcium} onChange={(e) => setNewProduct({ ...newProduct, calcium: e.target.value })} className="rounded-lg mt-1 h-9" />
                        </div>
                        <div>
                          <Label className="text-xs">Phosphorus %</Label>
                          <Input type="number" value={newProduct.phosphorus} onChange={(e) => setNewProduct({ ...newProduct, phosphorus: e.target.value })} className="rounded-lg mt-1 h-9" />
                        </div>
                        <div>
                          <Label className="text-xs">Taurine %</Label>
                          <Input type="number" value={newProduct.taurine} onChange={(e) => setNewProduct({ ...newProduct, taurine: e.target.value })} className="rounded-lg mt-1 h-9" />
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
                      <Label>Giá khuyến mãi (VND)</Label>
                      <Input
                        type="number"
                        value={editingProduct.sale_price || ""}
                        onChange={(e) => setEditingProduct({ ...editingProduct, sale_price: e.target.value })}
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

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Kết cấu (Texture)</Label>
                          <Select value={editingProduct.texture || ""} onValueChange={(val) => setEditingProduct({ ...editingProduct, texture: val })}>
                            <SelectTrigger className="rounded-lg mt-1 h-9"><SelectValue placeholder="Chọn kết cấu" /></SelectTrigger>
                            <SelectContent>
                              {Object.values(Texture).map((t) => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Nguồn Protein chính</Label>
                          <Select value={editingProduct.primary_protein_source || ""} onValueChange={(val) => setEditingProduct({ ...editingProduct, primary_protein_source: val })}>
                            <SelectTrigger className="rounded-lg mt-1 h-9"><SelectValue placeholder="Chọn nguồn protein" /></SelectTrigger>
                            <SelectContent>
                              {Object.values(PrimaryProteinSource).map((p) => (
                                <SelectItem key={p} value={p}>{p}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Mật độ năng lượng (Amount)</Label>
                          <Input
                            type="number"
                            value={editingProduct.caloric_density_amount || ""}
                            onChange={(e) => setEditingProduct({ ...editingProduct, caloric_density_amount: e.target.value })}
                            placeholder="3500"
                            className="rounded-lg mt-1 h-9"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Đơn vị (Unit)</Label>
                          <Select value={editingProduct.caloric_density_unit || "kcal/kg"} onValueChange={(val) => setEditingProduct({ ...editingProduct, caloric_density_unit: val })}>
                            <SelectTrigger className="rounded-lg mt-1 h-9"><SelectValue placeholder="Đơn vị" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="kcal/kg">kcal/kg</SelectItem>
                              <SelectItem value="kcal/cup">kcal/cup</SelectItem>
                              <SelectItem value="kcal/100g">kcal/100g</SelectItem>
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
                      <div className="grid grid-cols-4 gap-2">
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
                          <Label className="text-xs">Calories (Legacy)</Label>
                          <Input type="number" value={editingProduct.calories || ""} onChange={(e) => setEditingProduct({ ...editingProduct, calories: e.target.value })} className="rounded-lg mt-1 h-9" />
                        </div>
                        <div>
                          <Label className="text-xs">Calcium %</Label>
                          <Input type="number" value={editingProduct.calcium || ""} onChange={(e) => setEditingProduct({ ...editingProduct, calcium: e.target.value })} className="rounded-lg mt-1 h-9" />
                        </div>
                        <div>
                          <Label className="text-xs">Phosphorus %</Label>
                          <Input type="number" value={editingProduct.phosphorus || ""} onChange={(e) => setEditingProduct({ ...editingProduct, phosphorus: e.target.value })} className="rounded-lg mt-1 h-9" />
                        </div>
                        <div>
                          <Label className="text-xs">Taurine %</Label>
                          <Input type="number" value={editingProduct.taurine || ""} onChange={(e) => setEditingProduct({ ...editingProduct, taurine: e.target.value })} className="rounded-lg mt-1 h-9" />
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

          {/* Product Filters */}
          <div className="flex flex-wrap gap-4 items-center bg-card p-4 rounded-xl border shadow-sm">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm sản phẩm..."
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="pl-9 rounded-xl"
              />
            </div>
            <div className="w-[180px]">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả danh mục</SelectItem>
                  <SelectItem value="FOOD">Thức ăn</SelectItem>
                  <SelectItem value="TOY">Đồ chơi</SelectItem>
                  <SelectItem value="ACCESSORY">Phụ kiện</SelectItem>
                  <SelectItem value="MEDICINE">Thuốc & Y tế</SelectItem>
                  <SelectItem value="HYGIENE">Vệ sinh</SelectItem>
                  <SelectItem value="OTHER">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[180px]">
              <Select value={filterStock} onValueChange={setFilterStock}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Tình trạng kho" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả tình trạng</SelectItem>
                  <SelectItem value="IN_STOCK">Còn hàng</SelectItem>
                  <SelectItem value="OUT_OF_STOCK">Hết hàng</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(filterName || filterCategory !== "ALL" || filterStock !== "ALL") && (
              <Button
                variant="ghost"
                onClick={() => {
                  setFilterName("")
                  setFilterCategory("ALL")
                  setFilterStock("ALL")
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                Xóa bộ lọc
              </Button>
            )}
          </div>

          {productsLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
          ) : (
            <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[80px] font-semibold text-muted-foreground">ẢNH</TableHead>
                    <TableHead className="font-semibold text-muted-foreground max-w-[250px]">TÊN SẢN PHẨM</TableHead>
                    <TableHead className="font-semibold text-muted-foreground">DANH MỤC</TableHead>
                    <TableHead className="text-right font-semibold text-muted-foreground">GIÁ</TableHead>
                    <TableHead className="text-center font-semibold text-muted-foreground">KHO</TableHead>
                    <TableHead className="text-center font-semibold text-muted-foreground">ĐÃ BÁN</TableHead>
                    <TableHead className="text-center font-semibold text-muted-foreground">TRẠNG THÁI</TableHead>
                    <TableHead className="text-right font-semibold text-muted-foreground pr-6">THAO TÁC</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProducts?.map((product: any) => (
                    <TableRow key={product._id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="py-4 pl-4">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary border shadow-sm">
                          <Image
                            src={product.images?.[0]?.url || "/placeholder.svg"}
                            alt={product.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-foreground py-4 max-w-[250px] truncate" title={product.name}>
                        {product.name}
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge variant="outline" className="bg-background/50 font-normal">{product.category}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary py-4">
                        {product.sale_price ? (
                          <div className="flex flex-col items-end">
                            <span className="text-red-500">{formatPrice(product.sale_price)}</span>
                            <span className="text-xs text-muted-foreground line-through">{formatPrice(product.price)}</span>
                          </div>
                        ) : (
                          formatPrice(product.price)
                        )}
                      </TableCell>
                      <TableCell className="text-center py-4">{product.stock_quantity}</TableCell>
                      <TableCell className="text-center py-4 text-muted-foreground">{product.sold_quantity || 0}</TableCell>
                      <TableCell className="text-center py-4">
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
                          <span className={`text-xs font-medium ${product.is_active !== false ? "text-green-600" : "text-muted-foreground"}`}>
                            {product.is_active !== false ? "Hiển thị" : "Ẩn"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            className="rounded-lg h-8 w-8 hover:bg-primary/5 hover:text-primary transition-colors"
                            onClick={() => openEditProduct(product)}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="rounded-lg h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                            onClick={() => handleDeleteProduct(product._id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!paginatedProducts?.length && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                        Chưa có sản phẩm nào
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {/* Pagination Controls ... */}
              {totalPages > 1 && (
                <div className="flex items-center justify-end p-4 gap-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-lg"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-foreground/60">
                    Trang {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-lg"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </Card>
          )}
        </div>
      )
    }

    if (activeTab === "services") {
      return (
        <div className="space-y-4 p-1">
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
                  <div>
                    <Label>Danh mục *</Label>
                    <Select value={newService.category} onValueChange={(val) => setNewService({ ...newService, category: val })}>
                      <SelectTrigger className="rounded-xl mt-1">
                        <SelectValue placeholder="Chọn danh mục" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SPA">Spa & Grooming</SelectItem>
                        <SelectItem value="MEDICAL">Khám bệnh</SelectItem>
                        <SelectItem value="VACCINATION">Tiêm phòng</SelectItem>
                        <SelectItem value="DEWORMING">Tẩy giun</SelectItem>
                        <SelectItem value="PET_CARE">Chăm sóc thú cưng</SelectItem>
                      </SelectContent>
                    </Select>
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

          {/* Service Filters */}
          <div className="flex flex-wrap gap-4 items-center bg-card p-4 rounded-xl border shadow-sm">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm dịch vụ..."
                value={filterServiceName}
                onChange={(e) => setFilterServiceName(e.target.value)}
                className="pl-9 rounded-xl"
              />
            </div>
            <div className="w-[200px]">
              <Select value={filterServiceCategory} onValueChange={setFilterServiceCategory}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả danh mục</SelectItem>
                  <SelectItem value="SPA">Spa & Grooming</SelectItem>
                  <SelectItem value="MEDICAL">Khám bệnh</SelectItem>
                  <SelectItem value="VACCINATION">Tiêm phòng</SelectItem>
                  <SelectItem value="DEWORMING">Tẩy giun</SelectItem>
                  <SelectItem value="PET_CARE">Chăm sóc thú cưng</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                  <div>
                    <Label>Danh mục *</Label>
                    <Select value={editingService.category} onValueChange={(val) => setEditingService({ ...editingService, category: val })}>
                      <SelectTrigger className="rounded-xl mt-1">
                        <SelectValue placeholder="Chọn danh mục" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SPA">Spa & Grooming</SelectItem>
                        <SelectItem value="MEDICAL">Khám bệnh</SelectItem>
                        <SelectItem value="VACCINATION">Tiêm phòng</SelectItem>
                        <SelectItem value="DEWORMING">Tẩy giun</SelectItem>
                        <SelectItem value="PET_CARE">Chăm sóc thú cưng</SelectItem>
                      </SelectContent>
                    </Select>
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

          <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[80px] font-semibold text-muted-foreground">ẢNH</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">TÊN DỊCH VỤ</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">DANH MỤC</TableHead>
                  <TableHead className="text-center font-semibold text-muted-foreground">TRẠNG THÁI</TableHead>
                  <TableHead className="text-center font-semibold text-muted-foreground">THỜI GIAN</TableHead>
                  <TableHead className="text-right font-semibold text-muted-foreground">GIÁ</TableHead>
                  <TableHead className="text-right font-semibold text-muted-foreground pr-6">THAO TÁC</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedServices?.map((service: any) => (
                  <TableRow key={service._id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="py-4 pl-4">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary border shadow-sm">
                        <Image
                          src={service.image?.url || "/placeholder.svg"}
                          alt={service.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-foreground py-4">{service.name}</TableCell>
                    <TableCell className="py-4">
                      <Badge variant="outline" className="bg-background/50 font-normal">{service.category || "SPA"}</Badge>
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <Badge variant="outline" className={service.is_active ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-100 text-gray-700"}>
                        {service.is_active ? "Hoạt động" : "Tạm ngưng"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center py-4 text-muted-foreground">{service.duration_minutes} phút</TableCell>
                    <TableCell className="text-right font-bold text-primary py-4">
                      {formatPrice(service.price_min)}
                      {service.price_max && service.price_max > service.price_min && (
                        <span className="text-xs text-muted-foreground font-normal block"> - {formatPrice(service.price_max)}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="rounded-lg h-8 w-8 hover:bg-primary/5 hover:text-primary transition-colors"
                          onClick={() => openEditService(service)}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          className="rounded-lg h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                          onClick={() => {
                            setConfirmDialog({
                              open: true,
                              title: "Xóa dịch vụ?",
                              description: "Bạn có chắc muốn xóa dịch vụ này khỏi cửa hàng?",
                              confirmText: "Xóa dịch vụ",
                              variant: "destructive",
                              onConfirm: async () => {
                                try {
                                  const res = await merchantAPI.deleteService(service._id)
                                  if (res.success) {
                                    refetchServices()
                                    toast({
                                      title: "Đã xóa dịch vụ",
                                      description: "Dịch vụ đã được xóa thành công.",
                                    })
                                  } else {
                                    toast({
                                      variant: "destructive",
                                      title: "Lỗi",
                                      description: res.message || "Không thể xóa dịch vụ",
                                    })
                                  }
                                } catch {
                                  toast({
                                    variant: "destructive",
                                    title: "Lỗi hệ thống",
                                    description: "Lỗi khi xóa dịch vụ",
                                  })
                                }
                              }
                            })
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!paginatedServices?.length && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      Chưa có dịch vụ nào
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Service Pagination Controls */}
            {totalServicePages > 1 && (
              <div className="flex items-center justify-end p-4 gap-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentServicePage(p => Math.max(1, p - 1))}
                  disabled={currentServicePage === 1}
                  className="rounded-lg"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-foreground/60">
                  Trang {currentServicePage} / {totalServicePages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentServicePage(p => Math.min(totalServicePages, p + 1))}
                  disabled={currentServicePage === totalServicePages}
                  className="rounded-lg"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </Card>
        </div>
      )
    }

    if (activeTab === "orders") {
      return (
        <div className="space-y-4 p-1">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Đơn hàng</h1>
              <p className="text-foreground/60">{filteredOrders?.length} đơn hàng</p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: "Tất cả", value: "ALL", count: orders?.length || 0, color: "bg-blue-50 text-blue-700 border-blue-200", icon: FileText, gradient: "from-blue-50 to-blue-100" },
              { label: "Chờ xử lý", value: "PENDING", count: orders?.filter((o: any) => o.status === "PENDING").length || 0, color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: Clock, gradient: "from-yellow-50 to-yellow-100" },
              { label: "Đang giao", value: "SHIPPING", count: orders?.filter((o: any) => o.status === "SHIPPING").length || 0, color: "bg-purple-50 text-purple-700 border-purple-200", icon: Truck, gradient: "from-purple-50 to-purple-100" },
              { label: "Hoàn thành", value: "COMPLETED", count: orders?.filter((o: any) => ["COMPLETED", "DONE"].includes(o.status)).length || 0, color: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle2, gradient: "from-green-50 to-green-100" },
              { label: "Đã hủy", value: "CANCELLED", count: orders?.filter((o: any) => o.status === "CANCELLED").length || 0, color: "bg-red-50 text-red-700 border-red-200", icon: XCircle, gradient: "from-red-50 to-red-100" },
            ].map((status) => (
              <div
                key={status.value}
                onClick={() => setOrderFilter(status.value)}
                className={`
                    cursor-pointer rounded-2xl p-4 border transition-all duration-300
                    bg-gradient-to-r ${status.gradient}
                    ${orderFilter === status.value ? "ring-2 ring-primary ring-offset-2 scale-105 shadow-md" : "hover:scale-105 hover:shadow-sm opacity-80 hover:opacity-100"}
                  `}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-xl bg-white/60 backdrop-blur-sm shadow-sm ${status.color.split(" ")[1]}`}>
                    <status.icon className="w-5 h-5" />
                  </div>
                  {orderFilter === status.value && (
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground/70">{status.label}</p>
                  <p className="text-2xl font-bold text-foreground">{status.count}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4 px-1 pb-4">
            <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold text-muted-foreground w-[100px]">MÃ ĐƠN</TableHead>
                    <TableHead className="font-semibold text-muted-foreground">KHÁCH HÀNG</TableHead>
                    <TableHead className="font-semibold text-muted-foreground">NGÀY ĐẶT</TableHead>
                    <TableHead className="font-semibold text-muted-foreground text-center">SỐ LƯỢNG</TableHead>
                    <TableHead className="font-semibold text-muted-foreground text-right">TỔNG TIỀN</TableHead>
                    <TableHead className="font-semibold text-muted-foreground text-center">TRẠNG THÁI</TableHead>
                    <TableHead className="font-semibold text-muted-foreground text-right pr-6">THAO TÁC</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedOrders?.map((order: any) => (
                    <TableRow
                      key={order._id}
                      className="hover:bg-muted/50 transition-colors cursor-pointer group"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <TableCell className="font-medium text-foreground py-4 pl-4">
                        #{order._id.slice(-6).toUpperCase()}
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-foreground">{order.customer_id?.full_name}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {order.customer_id?.phone_number}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground py-4">
                        {new Date(order.created_at).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="text-center font-medium text-foreground py-4">
                        {order.items.length}
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary py-4">
                        {formatPrice(order.total_amount)}
                      </TableCell>
                      <TableCell className="text-center py-4">
                        {getStatusBadge(order.status)}
                      </TableCell>
                      <TableCell className="text-right pr-6 py-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground group-hover:text-primary transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(order);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Chi tiết
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!paginatedOrders?.length && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-foreground/50">
                        Không có đơn hàng nào
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination Controls */}
              {totalOrderPages > 1 && (
                <div className="flex items-center justify-end p-4 gap-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentOrderPage(p => Math.max(1, p - 1))}
                    disabled={currentOrderPage === 1}
                    className="rounded-lg"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-foreground/60">
                    Trang {currentOrderPage} / {totalOrderPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentOrderPage(p => Math.min(totalOrderPages, p + 1))}
                    disabled={currentOrderPage === totalOrderPages}
                    className="rounded-lg"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </Card>
          </div>


          {/* Order Detail Modal */}
          <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
            <DialogContent className="rounded-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Chi tiết đơn hàng #{selectedOrder?._id.slice(-6).toUpperCase()}</DialogTitle>
              </DialogHeader>
              {selectedOrder && (
                <div className="space-y-4 px-1 pb-4">
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

    if (activeTab === "bookings") {
      return (
        <div className="space-y-4 p-1">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Lịch hẹn</h1>
            <p className="text-foreground/60">{bookings?.length} lịch hẹn</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            {[
              { label: "Tất cả", value: "ALL", count: bookings?.length || 0, color: "bg-blue-50 text-blue-700 border-blue-200", icon: FileText, gradient: "from-blue-50 to-blue-100" },
              {
                label: "Hôm nay", value: "TODAY", count: bookings?.filter((b: any) => {
                  const now = new Date()
                  const bookingDate = new Date(b.booking_time)
                  return bookingDate.getDate() === now.getDate() && bookingDate.getMonth() === now.getMonth() && bookingDate.getFullYear() === now.getFullYear()
                }).length || 0, color: "bg-violet-50 text-violet-700 border-violet-200", icon: Calendar, gradient: "from-violet-50 to-violet-100"
              },
              { label: "Chờ xác nhận", value: "PENDING", count: bookings?.filter((b: any) => b.status === "PENDING").length || 0, color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: Clock, gradient: "from-yellow-50 to-yellow-100" },
              { label: "Đã xác nhận", value: "CONFIRMED", count: bookings?.filter((b: any) => b.status === "CONFIRMED").length || 0, color: "bg-cyan-50 text-cyan-700 border-cyan-200", icon: CheckCircle2, gradient: "from-cyan-50 to-cyan-100" },
              { label: "Hoàn thành", value: "COMPLETED", count: bookings?.filter((b: any) => b.status === "COMPLETED").length || 0, color: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle2, gradient: "from-green-50 to-green-100" },
              { label: "Đã hủy", value: "CANCELLED", count: bookings?.filter((b: any) => b.status === "CANCELLED").length || 0, color: "bg-red-50 text-red-700 border-red-200", icon: XCircle, gradient: "from-red-50 to-red-100" },
            ].map((status) => (
              <div
                key={status.value}
                onClick={() => setBookingFilter(status.value)}
                className={`
                    cursor-pointer rounded-2xl p-4 border transition-all duration-300
                    bg-gradient-to-r ${status.gradient}
                    ${bookingFilter === status.value ? "ring-2 ring-primary ring-offset-2 scale-105 shadow-md" : "hover:scale-105 hover:shadow-sm opacity-80 hover:opacity-100"}
                  `}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-xl bg-white/60 backdrop-blur-sm shadow-sm ${status.color.split(" ")[1]}`}>
                    <status.icon className="w-5 h-5" />
                  </div>
                  {bookingFilter === status.value && (
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground/70">{status.label}</p>
                  <p className="text-2xl font-bold text-foreground">{status.count}</p>
                </div>
              </div>
            ))}
          </div>

          <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-muted-foreground w-[150px]">DỊCH VỤ</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">KHÁCH HÀNG</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">THÚ CƯNG</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">THỜI GIAN</TableHead>
                  <TableHead className="font-semibold text-muted-foreground w-[200px]">GHI CHÚ</TableHead>
                  <TableHead className="font-semibold text-muted-foreground text-center">TRẠNG THÁI</TableHead>
                  <TableHead className="font-semibold text-muted-foreground text-right pr-6">THAO TÁC</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedBookings?.map((booking: any) => (
                  <TableRow key={booking._id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium text-foreground py-4 pl-4">
                      {booking.service_id?.name || "Dịch vụ"}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-foreground">{booking.customer_id?.full_name}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {booking.customer_id?.phone_number}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 font-medium text-foreground">{booking.pet_id?.name}</TableCell>
                    <TableCell className="py-4 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(booking.booking_time).toLocaleString("vi-VN", {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: '2-digit'
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 max-w-[200px]">
                      <p className="truncate text-muted-foreground text-sm" title={booking.note}>
                        {booking.note || "---"}
                      </p>
                    </TableCell>
                    <TableCell className="text-center py-4">
                      {getStatusBadge(booking.status)}
                    </TableCell>
                    <TableCell className="text-right pr-6 py-4">
                      {booking.status === "PENDING" && (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            className="h-8 rounded-lg bg-primary hover:bg-primary/90 shadow-sm"
                            onClick={() => handleUpdateBookingStatus(booking._id, "CONFIRMED")}
                          >
                            Xác nhận
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-lg text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleUpdateBookingStatus(booking._id, "CANCELLED")}
                          >
                            Từ chối
                          </Button>
                        </div>
                      )}
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-cyan-600 hover:bg-cyan-50"
                          onClick={() => {
                            setSelectedBooking(booking)
                            setShowBookingDetails(true)
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {booking.status === "CONFIRMED" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 rounded-lg text-green-600 hover:text-green-700 hover:bg-green-50 font-medium"
                            onClick={() => handleUpdateBookingStatus(booking._id, "COMPLETED")}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Hoàn thành
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!paginatedBookings?.length && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-foreground/50">
                      Chưa có lịch hẹn nào
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Bookings Pagination Controls */}
            {totalBookingPages > 1 && (
              <div className="flex items-center justify-end p-4 gap-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentBookingPage(p => Math.max(1, p - 1))}
                  disabled={currentBookingPage === 1}
                  className="rounded-lg"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-foreground/60">
                  Trang {currentBookingPage} / {totalBookingPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentBookingPage(p => Math.min(totalBookingPages, p + 1))}
                  disabled={currentBookingPage === totalBookingPages}
                  className="rounded-lg"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </Card>

          <Dialog open={showBookingDetails} onOpenChange={setShowBookingDetails}>
            <DialogContent className="max-w-2xl rounded-3xl">
              <DialogHeader>
                <DialogTitle>Chi tiết lịch hẹn</DialogTitle>
              </DialogHeader>
              {selectedBooking && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div className="space-y-4 px-1 pb-4">
                    <div>
                      <h3 className="font-semibold text-lg text-primary mb-2 flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Thông tin khách hàng
                      </h3>
                      <div className="bg-secondary/30 p-4 rounded-xl space-y-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Họ và tên</p>
                          <p className="font-medium">{selectedBooking.customer_id?.full_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Số điện thoại</p>
                          <p className="font-medium">{selectedBooking.customer_id?.phone_number}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">{selectedBooking.customer_id?.email || "---"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Địa chỉ</p>
                          <p className="font-medium">{selectedBooking.customer_id?.address || "---"}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg text-orange-600 mb-2 flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Thông tin dịch vụ
                      </h3>
                      <div className="bg-secondary/30 p-4 rounded-xl space-y-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Dịch vụ</p>
                          <p className="font-medium text-lg">{selectedBooking.service_id?.name}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Thời gian</p>
                            <p className="font-medium">
                              {new Date(selectedBooking.booking_time).toLocaleDateString("vi-VN")}
                            </p>
                            <p className="text-sm font-medium text-primary">
                              {new Date(selectedBooking.booking_time).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Thời lượng</p>
                            <p className="font-medium">{selectedBooking.service_id?.duration_minutes} phút</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Ghi chú</p>
                          <p className="font-medium italic text-foreground/80">"{selectedBooking.note || "Không có ghi chú"}"</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 px-1 pb-4">
                    <div>
                      <h3 className="font-semibold text-lg text-green-600 mb-2 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-paw-print"><circle cx="11" cy="4" r="2" /><circle cx="18" cy="8" r="2" /><circle cx="20" cy="16" r="2" /><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.92A3.5 3.5 0 0 1 5.5 10Z" /></svg>
                        Thông tin thú cưng
                      </h3>
                      <div className="bg-secondary/30 p-4 rounded-xl space-y-4">
                        <div className="flex justify-center">
                          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-sm">
                            <Image
                              src={selectedBooking.pet_id?.image?.url || "/placeholder-pet.png"}
                              alt={selectedBooking.pet_id?.name || "Pet"}
                              width={96}
                              height={96}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                        <div className="text-center">
                          <h4 className="text-xl font-bold">{selectedBooking.pet_id?.name}</h4>
                          <Badge variant="outline" className="mt-1">
                            {selectedBooking.pet_id?.species === 'DOG' ? 'Chó' : 'Mèo'} • {selectedBooking.pet_id?.breed}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-y-3 text-sm">
                          <div>
                            <p className="text-muted-foreground">Tuổi</p>
                            <p className="font-medium">{selectedBooking.pet_id?.age_months ? `${selectedBooking.pet_id.age_months} tháng` : "--"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Giới tính</p>
                            <p className="font-medium">{selectedBooking.pet_id?.gender === 'MALE' ? 'Đực' : 'Cái'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Cân nặng</p>
                            <p className="font-medium">{selectedBooking.pet_id?.weight_kg || "--"} kg</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Triệt sản</p>
                            <p className="font-medium">{selectedBooking.pet_id?.sterilized ? 'Rồi' : 'Chưa'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      )
    }

    if (activeTab === "scanner") {
      return (
        <div className="space-y-4 p-1">
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

    if (activeTab === "settings") {
      return <MerchantSettings />
    }

    if (activeTab === "medical-records") {
      return <MerchantMedicalRecords />
    }

    if (activeTab === "analytics") {
      return <MerchantAnalyticsComponent onBack={() => setActiveTab("dashboard")} />
    }

    return null
  }

  return (
    <>
      <div className="flex-1 space-y-4 p-3 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
        {renderContent()}
      </div>
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Hủy</AlertDialogCancel>
            <AlertDialogAction
              className={`rounded-xl ${confirmDialog.variant === "destructive" ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"}`}
              onClick={() => {
                confirmDialog.onConfirm();
                setConfirmDialog(prev => ({ ...prev, open: false }));
              }}
            >
              {confirmDialog.confirmText || "Tiếp tục"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
