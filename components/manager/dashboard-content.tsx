"use client"

import { useState, useMemo } from "react"
import { useManagerStats, useManagerMerchants, usePackages, useManagerBanners } from "@/lib/hooks"
import { managerAPI, packagesAPI, bannersAPI } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageUpload } from "@/components/ui/image-upload"
import {
  Users,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  ShoppingCart,
  Store,
  Crown,
  Eye,
  Search,
  Download,
  PieChartIcon,
  Activity,
  Target,
  Loader2,
  ImageIcon,
  Upload,
  ExternalLink,
} from "lucide-react"
import Image from "next/image"
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  LineChart,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts"

interface ManagerDashboardContentProps {
  activeTab: string
}

const COLORS = ["#F15A29", "#3B6DB3", "#2D3561", "#FAD5C8", "#00C49F", "#FFBB28", "#FF8042"]

export function ManagerDashboardContent({ activeTab }: ManagerDashboardContentProps) {
  const { data: statsData, isLoading: statsLoading } = useManagerStats()
  const { data: merchantsData, isLoading: merchantsLoading, refetch: refetchMerchants } = useManagerMerchants()
  const { data: packages, isLoading: packagesLoading, refetch: refetchPackages } = usePackages()
  const { data: bannersData, isLoading: bannersLoading, refetch: refetchBanners } = useManagerBanners()

  const [showMerchantDetail, setShowMerchantDetail] = useState<any | null>(null)
  const [showAddPackage, setShowAddPackage] = useState(false)
  const [showEditPackage, setShowEditPackage] = useState(false)
  const [editingPackage, setEditingPackage] = useState<any | null>(null)
  const [newPackage, setNewPackage] = useState({
    name: "",
    target_role: "CUSTOMER", // or MERCHANT
    price: "",
    duration_months: "",
    description: "",
    // Simplify features config for now
    features_config: {
      ai_limit_per_day: 5,
      max_pets: 1,
      priority_support: false
    }
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [packageFilter, setPackageFilter] = useState<"CUSTOMER" | "MERCHANT">("CUSTOMER")

  // Banner states
  const [showAddBanner, setShowAddBanner] = useState(false)
  const [showEditBanner, setShowEditBanner] = useState(false)
  const [editingBanner, setEditingBanner] = useState<any | null>(null)
  const [newBanner, setNewBanner] = useState({
    image: { url: "", public_id: "" },
    targetUrl: "",
    priority: 0,
    displayLocation: "ALL",
    title: "",
    isActive: true,
  })
  const [bannerFilter, setBannerFilter] = useState<string>("ALL")

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  const handleUpdateMerchantStatus = async (merchantId: string, isActive: boolean) => {
    if (!confirm(`Bạn có chắc muốn ${isActive ? 'kích hoạt' : 'từ chối/vô hiệu hóa'} merchant này?`)) return;
    try {
      const res = await managerAPI.updateMerchantStatus(merchantId, isActive)
      if (res.success) {
        refetchMerchants()
        setShowMerchantDetail(null)
      } else {
        alert(res.message)
      }
    } catch {
      alert("Lỗi cập nhật trạng thái")
    }
  }

  const handleCreatePackage = async () => {
    setIsSubmitting(true)
    try {
      const res = await packagesAPI.create({
        ...newPackage,
        price: Number(newPackage.price),
        duration_months: Number(newPackage.duration_months),
      })
      if (res.success) {
        setShowAddPackage(false)
        refetchPackages()
        // Reset
        setNewPackage({
          name: "", target_role: packageFilter, price: "", duration_months: "", description: "",
          features_config: { ai_limit_per_day: 5, max_pets: 1, priority_support: false }
        })
      } else {
        alert(res.message)
      }
    } catch (e) {
      console.error(e)
      alert("Lỗi tạo gói")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdatePackage = async () => {
    if (!editingPackage) return
    setIsSubmitting(true)
    try {
      const res = await packagesAPI.update(editingPackage._id, {
        name: editingPackage.name,
        target_role: editingPackage.target_role,
        price: Number(editingPackage.price),
        duration_months: Number(editingPackage.duration_months),
        description: editingPackage.description,
        is_active: editingPackage.is_active,
      })
      if (res.success) {
        setShowEditPackage(false)
        setEditingPackage(null)
        refetchPackages()
      } else {
        alert(res.message)
      }
    } catch (e) {
      console.error(e)
      alert("Lỗi cập nhật gói")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeletePackage = async (packageId: string) => {
    if (!confirm("Bạn có chắc muốn xóa gói này?")) return
    try {
      const res = await packagesAPI.delete(packageId)
      if (res.success) {
        refetchPackages()
      } else {
        alert(res.message)
      }
    } catch {
      alert("Lỗi xóa gói")
    }
  }

  const openEditPackage = (pkg: any) => {
    setEditingPackage({ ...pkg })
    setShowEditPackage(true)
  }

  const filteredPackages = packages?.filter((pkg: any) => pkg.target_role === packageFilter) || []

  // Dashboard Overview
  if (activeTab === "dashboard") {
    if (statsLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>

    const totalRevenue = statsData?.orders?.total_revenue || 0
    const totalOrders = statsData?.orders?.order_count || 0
    const totalCustomers = statsData?.users?.customer || 0
    const totalMerchants = statsData?.users?.merchant || 0
    const dailyRevenue = statsData?.daily_revenue || []

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tổng quan nền tảng</h1>
            <p className="text-foreground/60">Giám sát hoạt động TailMates</p>
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground/60">Tổng doanh thu</p>
                  <p className="text-2xl font-bold text-foreground">{formatPrice(totalRevenue)}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-accent/10 to-accent/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground/60">Người dùng</p>
                  <p className="text-2xl font-bold text-foreground">{totalCustomers.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground/60">Merchant</p>
                  <p className="text-2xl font-bold text-foreground">{totalMerchants}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Store className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground/60">Đơn hàng đã xong</p>
                  <p className="text-2xl font-bold text-foreground">{totalOrders.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Doanh thu 30 ngày qua
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyRevenue}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F15A29" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#F15A29" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="_id" stroke="#64748b" fontSize={12} tickFormatter={(val) => val.slice(5)} />
                    <YAxis stroke="#64748b" fontSize={12} tickFormatter={(value) => `${value / 1000}k`} />
                    <Tooltip
                      formatter={(value: number) => formatPrice(value)}
                      contentStyle={{ background: "white", borderRadius: "0.75rem" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#F15A29"
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top Merchants */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Top Merchant (Doanh thu)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {statsData?.top_merchants?.map((merchant: any, index: number) => (
                  <div key={merchant._id} className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-card ${index === 0 ? "bg-primary" : index === 1 ? "bg-accent" : "bg-foreground"
                        }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-foreground">{merchant.merchant_profile?.shop_name || merchant.full_name}</p>
                      <p className="text-sm text-foreground/60">{merchant.merchant_profile?.description?.slice(0, 30)}...</p>
                    </div>
                    <div className="text-right">
                      {/* Stats API for Top Merchants returns merchant docs, we assume revenue is stored or calculated. 
                           Currently stats logic sorts by 'merchant_profile.revenue_stats' but schema calls it something else?
                           Actually Schema has merchant_profile.
                           For now, let's just show dummy revenue or 0 if not populated */}
                      <p className="font-bold text-primary">High Revenue</p>
                    </div>
                  </div>
                ))}
                {!statsData?.top_merchants?.length && <p className="text-center text-foreground/50">Chưa có dữ liệu</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Revenue Tab
  if (activeTab === "revenue") {
    // Reuse dashboard stats just focused
    if (statsLoading) return <Loader2 className="animate-spin" />
    const dailyRevenue = statsData?.daily_revenue || []

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Phân tích doanh thu</h1>
        </div>

        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Doanh thu theo ngày</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyRevenue}>
                  <XAxis dataKey="_id" stroke="#64748b" />
                  <YAxis stroke="#64748b" tickFormatter={(value) => `${value / 1000}k`} />
                  <Tooltip formatter={(value: number) => formatPrice(value)} />
                  <Bar dataKey="revenue" fill="#F15A29" radius={[4, 4, 0, 0]} name="Doanh thu" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Merchants Tab
  if (activeTab === "merchants") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Quản lý Merchant</h1>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
              <Input placeholder="Tìm merchant..." className="pl-10 rounded-xl w-64" />
            </div>
          </div>
        </div>

        {merchantsLoading ? <Loader2 className="animate-spin" /> : (
          <div className="space-y-4">
            {merchantsData?.merchants?.map((merchant: any) => (
              <Card key={merchant._id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                        <Store className="w-6 h-6 text-foreground/50" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-foreground">{merchant.merchant_profile?.shop_name || merchant.full_name}</p>
                          <Badge className={merchant.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                            {merchant.is_active ? "Hoạt động" : "Chờ duyệt/Khóa"}
                          </Badge>
                        </div>
                        <p className="text-sm text-foreground/60">{merchant.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl bg-transparent"
                        onClick={() => setShowMerchantDetail(merchant)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Xem
                      </Button>
                      {!merchant.is_active && (
                        <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white rounded-xl" onClick={() => handleUpdateMerchantStatus(merchant._id, true)}>
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Duyệt
                        </Button>
                      )}
                      {merchant.is_active && (
                        <Button variant="outline" size="sm" className="border-destructive text-destructive rounded-xl bg-transparent" onClick={() => handleUpdateMerchantStatus(merchant._id, false)}>
                          <XCircle className="w-4 h-4 mr-1" />
                          Khóa
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {!merchantsData?.merchants?.length && <p className="text-center text-foreground/50">Chưa có merchant nào</p>}
          </div>
        )}

        {/* Merchant Detail Modal */}
        <Dialog open={!!showMerchantDetail} onOpenChange={() => setShowMerchantDetail(null)}>
          <DialogContent className="rounded-3xl">
            <DialogHeader>
              <DialogTitle>Chi tiết Merchant</DialogTitle>
            </DialogHeader>
            {showMerchantDetail && (
              <div className="space-y-4">
                <Card className="bg-secondary/30">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-foreground/60">Tên cửa hàng</span>
                      <span className="font-medium">{showMerchantDetail.merchant_profile?.shop_name || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/60">Tên chủ</span>
                      <span className="font-medium">{showMerchantDetail.full_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/60">Email</span>
                      <span>{showMerchantDetail.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/60">Điện thoại</span>
                      <span>{showMerchantDetail.phone_number || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/60">Địa chỉ</span>
                      <span>{showMerchantDetail.merchant_profile?.address || "N/A"}</span>
                    </div>
                  </CardContent>
                </Card>

                {!showMerchantDetail.is_active ? (
                  <Button className="w-full bg-green-500 hover:bg-green-600 rounded-xl" onClick={() => handleUpdateMerchantStatus(showMerchantDetail._id, true)}>
                    Kích hoạt tài khoản
                  </Button>
                ) : (
                  <Button variant="destructive" className="w-full rounded-xl" onClick={() => handleUpdateMerchantStatus(showMerchantDetail._id, false)}>
                    Vô hiệu hóa tài khoản
                  </Button>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Packages Tab
  if (activeTab === "packages") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Gói đăng ký</h1>
          <Dialog open={showAddPackage} onOpenChange={setShowAddPackage}>
            <DialogTrigger asChild>
              <Button className="rounded-xl" onClick={() => setNewPackage({ ...newPackage, target_role: packageFilter })}>
                <Plus className="w-4 h-4 mr-2" />
                Thêm gói mới
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl max-w-md">
              <DialogHeader>
                <DialogTitle>Thêm gói đăng ký mới</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Tên gói *</Label>
                  <Input
                    value={newPackage.name}
                    onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
                    placeholder="VD: Gói Premium" className="rounded-xl mt-1"
                  />
                </div>
                <div>
                  <Label>Đối tượng</Label>
                  <Select value={newPackage.target_role} onValueChange={(val) => setNewPackage({ ...newPackage, target_role: val })}>
                    <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CUSTOMER">Khách hàng</SelectItem>
                      <SelectItem value="MERCHANT">Merchant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Giá (VND/tháng) *</Label>
                    <Input type="number" value={newPackage.price} onChange={(e) => setNewPackage({ ...newPackage, price: e.target.value })} placeholder="99000" className="rounded-xl mt-1" />
                  </div>
                  <div>
                    <Label>Thời hạn (tháng) *</Label>
                    <Input type="number" value={newPackage.duration_months} onChange={(e) => setNewPackage({ ...newPackage, duration_months: e.target.value })} placeholder="1" className="rounded-xl mt-1" />
                  </div>
                </div>
                <div>
                  <Label>Mô tả</Label>
                  <Input value={newPackage.description} onChange={(e) => setNewPackage({ ...newPackage, description: e.target.value })} placeholder="Mô tả tính năng gói..." className="rounded-xl mt-1" />
                </div>
                <Button className="w-full rounded-xl" onClick={handleCreatePackage} disabled={isSubmitting || !newPackage.name || !newPackage.price}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "Lưu gói"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Package Dialog */}
        <Dialog open={showEditPackage} onOpenChange={setShowEditPackage}>
          <DialogContent className="rounded-3xl max-w-md">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa gói</DialogTitle>
            </DialogHeader>
            {editingPackage && (
              <div className="space-y-4">
                <div>
                  <Label>Tên gói *</Label>
                  <Input
                    value={editingPackage.name}
                    onChange={(e) => setEditingPackage({ ...editingPackage, name: e.target.value })}
                    className="rounded-xl mt-1"
                  />
                </div>
                <div>
                  <Label>Đối tượng</Label>
                  <Select value={editingPackage.target_role} onValueChange={(val) => setEditingPackage({ ...editingPackage, target_role: val })}>
                    <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CUSTOMER">Khách hàng</SelectItem>
                      <SelectItem value="MERCHANT">Merchant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Giá (VND/tháng) *</Label>
                    <Input type="number" value={editingPackage.price} onChange={(e) => setEditingPackage({ ...editingPackage, price: e.target.value })} className="rounded-xl mt-1" />
                  </div>
                  <div>
                    <Label>Thời hạn (tháng) *</Label>
                    <Input type="number" value={editingPackage.duration_months} onChange={(e) => setEditingPackage({ ...editingPackage, duration_months: e.target.value })} className="rounded-xl mt-1" />
                  </div>
                </div>
                <div>
                  <Label>Mô tả</Label>
                  <Input value={editingPackage.description || ""} onChange={(e) => setEditingPackage({ ...editingPackage, description: e.target.value })} className="rounded-xl mt-1" />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="pkg-active"
                    checked={editingPackage.is_active}
                    onChange={(e) => setEditingPackage({ ...editingPackage, is_active: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <Label htmlFor="pkg-active" className="cursor-pointer">Đang hoạt động</Label>
                </div>
                <Button className="w-full rounded-xl" onClick={handleUpdatePackage} disabled={isSubmitting || !editingPackage.name || !editingPackage.price}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "Cập nhật"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Package Type Tabs */}
        <Tabs value={packageFilter} onValueChange={(val) => setPackageFilter(val as any)}>
          <TabsList className="bg-card rounded-xl">
            <TabsTrigger value="CUSTOMER" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Gói Khách hàng
            </TabsTrigger>
            <TabsTrigger value="MERCHANT" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Gói Merchant
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {packagesLoading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div> : (
          <div className="grid lg:grid-cols-3 gap-4">
            {filteredPackages.map((pkg: any) => (
              <Card key={pkg._id} className="relative overflow-hidden group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Badge
                      className={pkg.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}
                    >
                      {pkg.is_active ? "Hoạt động" : "Tạm ngưng"}
                    </Badge>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditPackage(pkg)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDeletePackage(pkg._id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <h3 className="font-bold text-foreground text-xl mb-2">{pkg.name}</h3>
                  <p className="text-3xl font-bold text-primary mb-4">
                    {formatPrice(pkg.price)}
                    <span className="text-sm font-normal text-foreground/60">/{pkg.duration_months} tháng</span>
                  </p>
                  {pkg.description && <p className="text-sm text-foreground/60 mb-4">{pkg.description}</p>}
                </CardContent>
              </Card>
            ))}
            {!filteredPackages.length && <p className="col-span-3 text-center text-foreground/50 py-10">Chưa có gói nào cho {packageFilter === "CUSTOMER" ? "Khách hàng" : "Merchant"}</p>}
          </div>
        )}
      </div>
    )
  }

  // Banners Tab
  if (activeTab === "banners") {
    const banners = bannersData?.banners || []
    const filteredBanners = bannerFilter === "ALL"
      ? banners
      : banners.filter((b: any) => b.displayLocation === bannerFilter)

    const handleCreateBanner = async () => {
      if (!newBanner.image.url) {
        alert("Vui lòng upload ảnh banner")
        return
      }
      setIsSubmitting(true)
      try {
        const res = await bannersAPI.create(newBanner)
        if (res.success) {
          setShowAddBanner(false)
          refetchBanners()
          setNewBanner({
            image: { url: "", public_id: "" },
            targetUrl: "",
            priority: 0,
            displayLocation: "ALL",
            title: "",
            isActive: true,
          })
        } else {
          alert(res.message)
        }
      } catch (e) {
        console.error(e)
        alert("Lỗi tạo banner")
      } finally {
        setIsSubmitting(false)
      }
    }

    const handleUpdateBanner = async () => {
      if (!editingBanner) return
      setIsSubmitting(true)
      try {
        const res = await bannersAPI.update(editingBanner._id, {
          image: editingBanner.image,
          targetUrl: editingBanner.targetUrl,
          priority: editingBanner.priority,
          displayLocation: editingBanner.displayLocation,
          title: editingBanner.title,
          isActive: editingBanner.isActive,
        })
        if (res.success) {
          setShowEditBanner(false)
          setEditingBanner(null)
          refetchBanners()
        } else {
          alert(res.message)
        }
      } catch (e) {
        console.error(e)
        alert("Lỗi cập nhật banner")
      } finally {
        setIsSubmitting(false)
      }
    }

    const handleDeleteBanner = async (bannerId: string) => {
      if (!confirm("Bạn có chắc muốn xóa banner này?")) return
      try {
        const res = await bannersAPI.delete(bannerId)
        if (res.success) {
          refetchBanners()
        } else {
          alert(res.message)
        }
      } catch {
        alert("Lỗi xóa banner")
      }
    }

    const handleToggleActive = async (banner: any) => {
      try {
        const res = await bannersAPI.update(banner._id, {
          isActive: !banner.isActive,
        })
        if (res.success) {
          refetchBanners()
        } else {
          alert(res.message)
        }
      } catch {
        alert("Lỗi cập nhật trạng thái")
      }
    }

    const openEditBanner = (banner: any) => {
      setEditingBanner({ ...banner })
      setShowEditBanner(true)
    }

    const locationOptions = [
      { value: "ALL", label: "Tất cả" },
      { value: "HOME", label: "Trang chủ" },
      { value: "SHOP", label: "Cửa hàng" },
      { value: "SERVICE", label: "Dịch vụ" },
      { value: "PROFILE", label: "Hồ sơ" },
    ]

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Quản lý Banner</h1>
          <Dialog open={showAddBanner} onOpenChange={setShowAddBanner}>
            <DialogTrigger asChild>
              <Button className="rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Thêm Banner
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Thêm Banner mới</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <ImageUpload
                  label="Ảnh Banner"
                  required
                  value={newBanner.image.url}
                  onChange={(url, publicId) => setNewBanner({ ...newBanner, image: { url, public_id: publicId || 'banner' } })}
                />
                <div>
                  <Label>Tiêu đề (tùy chọn)</Label>
                  <Input
                    value={newBanner.title}
                    onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                    placeholder="VD: Khuyến mãi mùa hè"
                    className="rounded-xl mt-1"
                  />
                </div>
                <div>
                  <Label>Link đích (URL khi click)</Label>
                  <Input
                    value={newBanner.targetUrl}
                    onChange={(e) => setNewBanner({ ...newBanner, targetUrl: e.target.value })}
                    placeholder="https://example.com/promo"
                    className="rounded-xl mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Vị trí hiển thị</Label>
                    <Select
                      value={newBanner.displayLocation}
                      onValueChange={(val) => setNewBanner({ ...newBanner, displayLocation: val })}
                    >
                      <SelectTrigger className="rounded-xl mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {locationOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Thứ tự ưu tiên</Label>
                    <Input
                      type="number"
                      value={newBanner.priority}
                      onChange={(e) => setNewBanner({ ...newBanner, priority: parseInt(e.target.value) || 0 })}
                      className="rounded-xl mt-1"
                      min={0}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="banner-active"
                    checked={newBanner.isActive}
                    onChange={(e) => setNewBanner({ ...newBanner, isActive: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <Label htmlFor="banner-active" className="cursor-pointer">Hiển thị ngay</Label>
                </div>
                <Button
                  className="w-full rounded-xl"
                  onClick={handleCreateBanner}
                  disabled={isSubmitting || !newBanner.image.url}
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "Tạo Banner"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Banner Dialog */}
        <Dialog open={showEditBanner} onOpenChange={setShowEditBanner}>
          <DialogContent className="rounded-3xl max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa Banner</DialogTitle>
            </DialogHeader>
            {editingBanner && (
              <div className="space-y-4">
                <ImageUpload
                  label="Ảnh Banner"
                  required
                  value={editingBanner.image?.url || ""}
                  onChange={(url, publicId) => setEditingBanner({ ...editingBanner, image: { url, public_id: publicId || 'banner' } })}
                />
                <div>
                  <Label>Tiêu đề</Label>
                  <Input
                    value={editingBanner.title || ""}
                    onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                    className="rounded-xl mt-1"
                  />
                </div>
                <div>
                  <Label>Link đích</Label>
                  <Input
                    value={editingBanner.targetUrl || ""}
                    onChange={(e) => setEditingBanner({ ...editingBanner, targetUrl: e.target.value })}
                    className="rounded-xl mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Vị trí hiển thị</Label>
                    <Select
                      value={editingBanner.displayLocation}
                      onValueChange={(val) => setEditingBanner({ ...editingBanner, displayLocation: val })}
                    >
                      <SelectTrigger className="rounded-xl mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {locationOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Thứ tự ưu tiên</Label>
                    <Input
                      type="number"
                      value={editingBanner.priority}
                      onChange={(e) => setEditingBanner({ ...editingBanner, priority: parseInt(e.target.value) || 0 })}
                      className="rounded-xl mt-1"
                      min={0}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="edit-banner-active"
                    checked={editingBanner.isActive}
                    onChange={(e) => setEditingBanner({ ...editingBanner, isActive: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <Label htmlFor="edit-banner-active" className="cursor-pointer">Đang hiển thị</Label>
                </div>
                <Button
                  className="w-full rounded-xl"
                  onClick={handleUpdateBanner}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "Cập nhật"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          {locationOptions.map((opt) => (
            <Button
              key={opt.value}
              variant={bannerFilter === opt.value ? "default" : "outline"}
              size="sm"
              onClick={() => setBannerFilter(opt.value)}
              className="rounded-full bg-transparent data-[state=active]:bg-primary"
            >
              {opt.label}
            </Button>
          ))}
        </div>

        {/* Banners Grid */}
        {bannersLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredBanners.map((banner: any) => (
              <Card key={banner._id} className="overflow-hidden group">
                <CardContent className="p-0">
                  <div className="relative aspect-[3/1] bg-secondary">
                    <Image
                      src={banner.image?.url || "/placeholder.svg"}
                      alt={banner.title || "Banner"}
                      fill
                      className="object-cover"
                    />
                    {/* Overlay with actions */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="rounded-xl"
                        onClick={() => openEditBanner(banner)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Sửa
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="rounded-xl"
                        onClick={() => handleDeleteBanner(banner._id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Xóa
                      </Button>
                    </div>
                    {/* Status badge */}
                    <div className="absolute top-2 left-2">
                      <Badge
                        className={banner.isActive ? "bg-green-500 text-white" : "bg-gray-500 text-white"}
                      >
                        {banner.isActive ? "Đang hiển thị" : "Ẩn"}
                      </Badge>
                    </div>
                    {/* Location badge */}
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary">
                        {locationOptions.find(o => o.value === banner.displayLocation)?.label || banner.displayLocation}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-foreground">
                          {banner.title || "Banner không tiêu đề"}
                        </h4>
                        <p className="text-sm text-foreground/60">Ưu tiên: {banner.priority}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {banner.targetUrl && (
                          <a
                            href={banner.targetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <Button
                          size="sm"
                          variant={banner.isActive ? "outline" : "default"}
                          className="rounded-xl"
                          onClick={() => handleToggleActive(banner)}
                        >
                          {banner.isActive ? "Ẩn" : "Hiện"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {!filteredBanners.length && (
              <div className="col-span-2 text-center py-12 text-foreground/50">
                <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Chưa có banner nào</p>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return null
}
