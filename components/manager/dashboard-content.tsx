"use client"

import { useState, useMemo } from "react"
import { useManagerStats, useManagerMerchants, usePackages, useManagerBanners, useManagerSubscriptions, useSocialFeed } from "@/lib/hooks"
import { useAuth } from "@/lib/auth-context"
import { managerAPI, packagesAPI, bannersAPI } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ImageUpload } from "@/components/ui/image-upload"
import { ProfileSettings } from "@/components/customer/profile-settings"
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
  ChevronUp,
  ChevronDown,
  Check,
  X,
  Zap,
  Newspaper,
  ChevronRight,
} from "lucide-react"
import Image from "next/image"
import dynamic from "next/dynamic"

const ManagerOverview = dynamic(() => import("./manager-overview").then(m => m.ManagerOverview), {
  loading: () => <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
})
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
  setActiveTab: (tab: any) => void
}

const COLORS = ["#F15A29", "#3B6DB3", "#2D3561", "#FAD5C8", "#00C49F", "#FFBB28", "#FF8042"]

const FEATURE_TOGGLE_LABELS: Record<string, string> = {
  pawmate_connect: "🐾 PawMate kết nối",
  blog_posting: "📝 Đăng blog",
  ai_personality: "🤖 AI phân tích tính cách",
  ai_recommendations: "🍖 AI gợi ý thức ăn/dịch vụ",
  priority_support: "⭐ Hỗ trợ ưu tiên",
}

const FeaturesConfigEditor = ({ config, onChange }: { config: any, onChange: (config: any) => void }) => {
  const toggleKeys = ["pawmate_connect", "blog_posting", "ai_personality", "ai_recommendations", "priority_support"]
  return (
    <div className="space-y-3 mt-4 border-t pt-4">
      <Label className="text-sm font-bold">Cấu hình tính năng</Label>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs text-foreground/60">Số thú cưng tối đa</Label>
          <Input
            type="number"
            min={1}
            value={config.max_pets ?? 1}
            onChange={(e) => onChange({ ...config, max_pets: Number(e.target.value) })}
            className="rounded-xl h-8"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-foreground/60">Giới hạn AI / ngày</Label>
          <Input
            type="number"
            min={0}
            value={config.ai_limit_per_day ?? 5}
            onChange={(e) => onChange({ ...config, ai_limit_per_day: Number(e.target.value) })}
            className="rounded-xl h-8"
          />
        </div>
      </div>
      <div className="space-y-2">
        {toggleKeys.map((key) => (
          <label key={key} className="flex items-center gap-2.5 p-2 bg-secondary/20 rounded-xl cursor-pointer hover:bg-secondary/40 transition-colors">
            <input
              type="checkbox"
              checked={!!config[key]}
              onChange={(e) => onChange({ ...config, [key]: e.target.checked })}
              className="w-4 h-4 rounded text-primary focus:ring-primary"
            />
            <span className="text-sm font-medium">{FEATURE_TOGGLE_LABELS[key]}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

const BenefitsEditor = ({ benefits, onChange }: { benefits: any[], onChange: (benefits: any[]) => void }) => {
  const addBenefit = () => onChange([...benefits, { text: "", is_bold: false, color: "" }])
  const removeBenefit = (index: number) => onChange(benefits.filter((_, i) => i !== index))
  const updateBenefit = (index: number, field: string, value: any) => {
    const newBenefits = [...benefits]
    newBenefits[index] = { ...newBenefits[index], [field]: value }
    onChange(newBenefits)
  }

  return (
    <div className="space-y-3 mt-4 border-t pt-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-bold">Danh sách đặc quyền</Label>
        <Button type="button" variant="outline" size="sm" onClick={addBenefit} className="h-7 px-2 rounded-lg">
          <Plus className="w-3 h-3 mr-1" /> Thêm
        </Button>
      </div>
      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
        {benefits.map((benefit, index) => (
          <div key={index} className="flex flex-col gap-2 p-2 bg-secondary/30 rounded-lg relative group">
            <Input
              value={benefit.text}
              onChange={(e) => updateBenefit(index, "text", e.target.value)}
              placeholder="Nhập đặc quyền..."
              className="h-8 text-sm"
            />
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={benefit.is_bold}
                  onChange={(e) => updateBenefit(index, "is_bold", e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-xs">In đậm</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={benefit.color === "orange"}
                  onChange={(e) => updateBenefit(index, "color", e.target.checked ? "orange" : "")}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-xs text-orange-600">Màu cam</span>
              </label>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeBenefit(index)}
                className="h-6 w-6 ml-auto text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
        {benefits.length === 0 && <p className="text-xs text-center text-foreground/40 py-2">Chưa có đặc quyền nào</p>}
      </div>
    </div>
  )
}

export function ManagerDashboardContent({ activeTab, setActiveTab }: ManagerDashboardContentProps) {
  const [subscriptionPage, setSubscriptionPage] = useState(1)
  const { data: statsData, isLoading: statsLoading } = useManagerStats()
  const { data: merchantsData, isLoading: merchantsLoading, refetch: refetchMerchants } = useManagerMerchants()
  const { data: packages, isLoading: packagesLoading, refetch: refetchPackages } = usePackages()
  const { data: subsData, isLoading: subsLoading } = useManagerSubscriptions({ page: subscriptionPage, limit: 10 })
  const { data: bannersData, isLoading: bannersLoading, refetch: refetchBanners } = useManagerBanners()
  const { user, refreshUser } = useAuth()

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
    order: 0,
    benefits: [] as { text: string; is_bold: boolean; color: string }[],
    features_config: {
      ai_limit_per_day: 5,
      max_pets: 1,
      priority_support: false,
      pawmate_connect: false,
      blog_posting: false,
      ai_personality: false,
      ai_recommendations: false,
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
  const [deletingBannerId, setDeletingBannerId] = useState<string | null>(null)

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
          name: "",
          target_role: packageFilter,
          price: "",
          duration_months: "",
          description: "",
          order: 0,
          benefits: [],
          features_config: { ai_limit_per_day: 5, max_pets: 1, priority_support: false, pawmate_connect: false, blog_posting: false, ai_personality: false, ai_recommendations: false }
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
        benefits: editingPackage.benefits,
        features_config: editingPackage.features_config,
        order: Number(editingPackage.order),
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

  const handleUpdatePackageFields = async (packageId: string, fields: any) => {
    try {
      const res = await packagesAPI.update(packageId, fields)
      if (res.success) {
        refetchPackages()
      } else {
        alert(res.message)
      }
    } catch {
      alert("Lỗi cập nhật nhanh")
    }
  }

  const openEditPackage = (pkg: any) => {
    setEditingPackage({ ...pkg })
    setShowEditPackage(true)
  }

  const filteredPackages = packages?.filter((pkg: any) => pkg.target_role === packageFilter) || []

  // Dashboard Overview
  if (activeTab === "dashboard") {
    return <ManagerOverview setActiveTab={setActiveTab} />
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
          <div>
            <h1 className="text-2xl font-bold text-foreground">Quản lý Gói đăng ký</h1>
            <p className="text-sm text-foreground/60">Thiết lập các gói dịch vụ cho khách hàng và merchant</p>
          </div>
          <Dialog open={showAddPackage} onOpenChange={setShowAddPackage}>
            <DialogTrigger asChild>
              <Button className="rounded-xl shadow-lg shadow-primary/20" onClick={() => setNewPackage({ ...newPackage, target_role: packageFilter })}>
                <Plus className="w-4 h-4 mr-2" />
                Thêm gói mới
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Thêm gói đăng ký mới</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tên gói *</Label>
                    <Input
                      value={newPackage.name}
                      onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
                      placeholder="VD: Gói Premium" className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Thứ tự hiển thị</Label>
                    <Input
                      type="number"
                      value={newPackage.order}
                      onChange={(e) => setNewPackage({ ...newPackage, order: Number(e.target.value) })}
                      placeholder="0" className="rounded-xl"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Đối tượng</Label>
                    <Select value={newPackage.target_role} onValueChange={(val) => setNewPackage({ ...newPackage, target_role: val })}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CUSTOMER">Khách hàng</SelectItem>
                        <SelectItem value="MERCHANT">Merchant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Thời hạn (tháng) *</Label>
                    <Input type="number" value={newPackage.duration_months} onChange={(e) => setNewPackage({ ...newPackage, duration_months: e.target.value })} placeholder="1" className="rounded-xl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Giá (VND) *</Label>
                  <Input type="number" value={newPackage.price} onChange={(e) => setNewPackage({ ...newPackage, price: e.target.value })} placeholder="99000" className="rounded-xl" />
                </div>

                <FeaturesConfigEditor
                  config={newPackage.features_config}
                  onChange={(features_config) => setNewPackage({ ...newPackage, features_config })}
                />

                <BenefitsEditor
                  benefits={newPackage.benefits}
                  onChange={(benefits) => setNewPackage({ ...newPackage, benefits })}
                />

                <Button className="w-full rounded-xl h-11 text-lg" onClick={handleCreatePackage} disabled={isSubmitting || !newPackage.name || !newPackage.price}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "Tạo gói ngay"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Package Dialog */}
        <Dialog open={showEditPackage} onOpenChange={setShowEditPackage}>
          <DialogContent className="rounded-3xl max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa gói</DialogTitle>
            </DialogHeader>
            {editingPackage && (
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tên gói *</Label>
                    <Input
                      value={editingPackage.name}
                      onChange={(e) => setEditingPackage({ ...editingPackage, name: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Thứ tự hiển thị</Label>
                    <Input
                      type="number"
                      value={editingPackage.order}
                      onChange={(e) => setEditingPackage({ ...editingPackage, order: Number(e.target.value) })}
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Đối tượng</Label>
                    <Select value={editingPackage.target_role} onValueChange={(val) => setEditingPackage({ ...editingPackage, target_role: val })}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CUSTOMER">Khách hàng</SelectItem>
                        <SelectItem value="MERCHANT">Merchant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Thời hạn (tháng) *</Label>
                    <Input type="number" value={editingPackage.duration_months} onChange={(e) => setEditingPackage({ ...editingPackage, duration_months: e.target.value })} className="rounded-xl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Giá (VND) *</Label>
                  <Input type="number" value={editingPackage.price} onChange={(e) => setEditingPackage({ ...editingPackage, price: e.target.value })} className="rounded-xl" />
                </div>

                <FeaturesConfigEditor
                  config={editingPackage.features_config || {}}
                  onChange={(features_config) => setEditingPackage({ ...editingPackage, features_config })}
                />

                <BenefitsEditor
                  benefits={editingPackage.benefits || []}
                  onChange={(benefits) => setEditingPackage({ ...editingPackage, benefits })}
                />

                <div className="flex items-center gap-2 p-2 bg-secondary/20 rounded-xl">
                  <input
                    type="checkbox"
                    id="pkg-active"
                    checked={editingPackage.is_active}
                    onChange={(e) => setEditingPackage({ ...editingPackage, is_active: e.target.checked })}
                    className="w-4 h-4 rounded text-primary"
                  />
                  <Label htmlFor="pkg-active" className="cursor-pointer font-medium">Đang cho phép đăng ký</Label>
                </div>

                <Button className="w-full rounded-xl h-11 text-lg" onClick={handleUpdatePackage} disabled={isSubmitting || !editingPackage.name || !editingPackage.price}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "Cập nhật thay đổi"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="bg-card/50 p-1 rounded-2xl border mb-6">
            <TabsTrigger value="list" className="rounded-xl px-6 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">
              Cài đặt gói
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl px-6 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">
              Lượt đăng ký
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-6 mt-0">
            {/* Package Type Tabs */}
            <div className="bg-card/50 p-1.5 rounded-2xl inline-flex border">
              <button
                onClick={() => setPackageFilter("CUSTOMER")}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${packageFilter === "CUSTOMER" ? "bg-primary text-white shadow-md" : "text-foreground/60 hover:text-foreground"
                  }`}
              >
                Dành cho Khách hàng
              </button>
              <button
                onClick={() => setPackageFilter("MERCHANT")}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${packageFilter === "MERCHANT" ? "bg-primary text-white shadow-md" : "text-foreground/60 hover:text-foreground"
                  }`}
              >
                Dành cho Merchant
              </button>
            </div>

            {packagesLoading ? (
              <div className="flex flex-col items-center justify-center p-20 gap-4">
                <Loader2 className="animate-spin w-10 h-10 text-primary" />
                <p className="text-foreground/50">Đang tải danh sách gói...</p>
              </div>
            ) : (
              <Card className="rounded-2xl overflow-hidden border-none shadow-sm">
                <Table>
                  <TableHeader className="bg-secondary/30">
                    <TableRow>
                      <TableHead className="w-[80px] font-bold">Thứ tự</TableHead>
                      <TableHead className="font-bold">Tên gói</TableHead>
                      <TableHead className="font-bold">Giá & Thời hạn</TableHead>
                      <TableHead className="font-bold">Trạng thái</TableHead>
                      <TableHead className="text-right font-bold pr-6">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPackages.map((pkg: any) => (
                      <TableRow key={pkg._id} className="hover:bg-secondary/10 transition-colors">
                        <TableCell className="font-medium text-center">
                          <Badge variant="outline" className="rounded-lg">{pkg.order}</Badge>
                        </TableCell>
                        <TableCell>
                          <p className="font-bold text-foreground">{pkg.name}</p>
                          <p className="text-xs text-foreground/50">{pkg.target_role === "CUSTOMER" ? "Khách hàng" : "Merchant"}</p>
                        </TableCell>
                        <TableCell>
                          <p className="font-bold text-primary">{formatPrice(pkg.price)}</p>
                          <p className="text-xs text-foreground/50">{pkg.duration_months} tháng</p>
                        </TableCell>
                        <TableCell>
                          <Badge className={`rounded-full px-3 ${pkg.is_active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                            {pkg.is_active ? "Đang hoạt động" : "Tạm ngưng"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 hover:text-primary"
                              onClick={() => openEditPackage(pkg)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className={`h-8 w-8 p-0 rounded-lg ${pkg.is_active ? "hover:bg-destructive/10 hover:text-destructive" : "hover:bg-green-100 hover:text-green-600"}`}
                              onClick={() => {
                                if (pkg.is_active) {
                                  if (confirm("Vô hiệu hóa gói này? Phải chỉnh sửa để kích hoạt lại.")) {
                                    handleUpdatePackageFields(pkg._id, { is_active: false })
                                  }
                                } else {
                                  handleUpdatePackageFields(pkg._id, { is_active: true })
                                }
                              }}
                            >
                              {pkg.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!filteredPackages.length && (
                      <TableRow>
                        <TableCell colSpan={5} className="h-40 text-center text-foreground/40 italic">
                          Chưa có gói nào cho {packageFilter === "CUSTOMER" ? "Khách hàng" : "Merchant"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-0 space-y-6">
            {subsLoading ? (
              <div className="flex flex-col items-center justify-center p-20 gap-4">
                <Loader2 className="animate-spin w-10 h-10 text-primary" />
                <p className="text-foreground/50">Đang tải lịch sử đăng ký...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-none shadow-sm bg-blue-50/50 backdrop-blur-md">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
                        <DollarSign className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-blue-600/70 uppercase tracking-widest">Tổng doanh thu gói</p>
                        <p className="text-xl font-black text-blue-900">{formatPrice(subsData?.total_revenue || 0)}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm bg-purple-50/50 backdrop-blur-md">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600">
                        <Crown className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-purple-600/70 uppercase tracking-widest">Tổng lượt đăng ký</p>
                        <p className="text-xl font-black text-purple-900">{(subsData?.pagination?.total || 0).toLocaleString()}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm bg-orange-50/50 backdrop-blur-md">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
                        <Zap className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-orange-600/70 uppercase tracking-widest">Gói phổ biến nhất</p>
                        <p className="text-lg font-black text-orange-900 truncate max-w-[150px]">
                          {statsData?.packages?.performance?.[0] 
                            ? (packages?.find((p: any) => p._id === statsData.packages.performance[0]._id)?.name || "N/A")
                            : "N/A"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              <Card className="rounded-2xl overflow-hidden border-none shadow-sm">
                <Table>
                  <TableHeader className="bg-secondary/30">
                    <TableRow>
                      <TableHead className="w-[60px] font-bold">STT</TableHead>
                      <TableHead className="font-bold">Khách hàng</TableHead>
                      <TableHead className="font-bold">Gói dịch vụ</TableHead>
                      <TableHead className="font-bold">Số tiền</TableHead>
                      <TableHead className="font-bold">Thời gian</TableHead>
                      <TableHead className="font-bold">Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subsData?.subscriptions?.map((sub: any, index: number) => (
                      <TableRow key={sub._id} className="hover:bg-secondary/10 transition-colors">
                        <TableCell className="text-center font-medium text-foreground/60">
                          {(subscriptionPage - 1) * 10 + index + 1}
                        </TableCell>
                        <TableCell>
                          <p className="font-bold text-foreground">{sub.user_id?.full_name || "N/A"}</p>
                          <p className="text-xs text-foreground/50">{sub.user_id?.email}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="rounded-lg">{sub.package_id?.name || "N/A"}</Badge>
                        </TableCell>
                        <TableCell className="font-bold text-primary">
                          {formatPrice(sub.amount)}
                        </TableCell>
                        <TableCell className="text-sm text-foreground/60">
                          {new Date(sub.created_at).toLocaleString("vi-VN")}
                        </TableCell>
                        <TableCell>
                          <Badge className={`rounded-full px-3 ${sub.status === "SUCCESS" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {sub.status === "SUCCESS" ? "Thành công" : sub.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!subsData?.subscriptions?.length && (
                      <TableRow>
                        <TableCell colSpan={6} className="h-40 text-center text-foreground/40 italic">
                          Chưa có lượt đăng ký nào
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                {subsData?.pagination && (
                  <div className="flex items-center justify-between p-4 border-t bg-secondary/10">
                    <p className="text-sm text-foreground/60">
                      Tổng cộng {subsData.pagination.total || 0} lượt đăng ký
                    </p>
                    <div className="flex gap-1.5 items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={subscriptionPage === 1}
                        onClick={() => {
                          setSubscriptionPage(prev => Math.max(1, prev - 1))
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                        className="h-8 w-8 rounded-lg"
                      >
                        <ChevronDown className="w-4 h-4 rotate-90" />
                      </Button>
                      
                      {Array.from({ length: subsData.pagination.pages || 1 }, (_, i) => i + 1).map((p) => (
                        <Button
                          key={p}
                          variant={subscriptionPage === p ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setSubscriptionPage(p)
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                          }}
                          className={`h-8 w-8 p-0 rounded-lg transition-all ${
                            subscriptionPage === p 
                              ? "bg-primary text-white shadow-md shadow-primary/20 scale-105" 
                              : "hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                          }`}
                        >
                          {p}
                        </Button>
                      ))}

                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={subscriptionPage === (subsData.pagination.pages || 1)}
                        onClick={() => {
                          setSubscriptionPage(prev => prev + 1)
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                        className="h-8 w-8 rounded-lg"
                      >
                        <ChevronDown className="w-4 h-4 -rotate-90" />
                      </Button>
                    </div>
                  </div>
                )}
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  // Social Summary Tab
  if (activeTab === "social") {
    const { posts, isLoading: socialLoading } = useSocialFeed()

    const totalReactions = useMemo(() => {
      return posts.reduce((acc, post) => acc + (post.reactionsCount || 0), 0)
    }, [posts])

    const totalComments = useMemo(() => {
      return posts.reduce((acc, post) => acc + (post.commentsCount || 0), 0)
    }, [posts])

    return (
      <div className="space-y-6 px-1">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-foreground">Tổng quan Mạng xã hội</h2>
            <p className="text-sm text-foreground/50 font-medium">Theo dõi hoạt động của người dùng trên nền tảng</p>
          </div>
        </div>

        {/* Social Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-none shadow-sm bg-indigo-50/50 backdrop-blur-md">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                <Newspaper className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-indigo-600/70 uppercase tracking-widest">Bài viết gần đây</p>
                <p className="text-xl font-black text-indigo-900">{posts.length}+</p>
                <p className="text-[10px] text-indigo-400 font-bold mt-0.5 mt-0.5">Cập nhật thời gian thực</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-pink-50/50 backdrop-blur-md">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 flex items-center justify-center text-pink-600">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-pink-600/70 uppercase tracking-widest">Tổng tương tác</p>
                <p className="text-xl font-black text-pink-900">{totalReactions.toLocaleString()}</p>
                <p className="text-[10px] text-pink-400 font-bold mt-0.5">Likes, Hearts, ...</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-teal-50/50 backdrop-blur-md">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 flex items-center justify-center text-teal-600">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-teal-600/70 uppercase tracking-widest">Bình luận</p>
                <p className="text-xl font-black text-teal-900">{totalComments.toLocaleString()}</p>
                <p className="text-[10px] text-teal-400 font-bold mt-0.5">Thảo luận sôi nổi</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Latest Activity Table */}
        <Card className="rounded-2xl overflow-hidden border-none shadow-sm">
          <CardHeader className="bg-white/50 border-b border-secondary/20">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" /> Bài viết mới nhất
            </CardTitle>
          </CardHeader>
          <Table>
            <TableHeader className="bg-secondary/30">
              <TableRow>
                <TableHead className="font-bold">Người đăng</TableHead>
                <TableHead className="font-bold">Nội dung</TableHead>
                <TableHead className="font-bold">Tương tác</TableHead>
                <TableHead className="font-bold text-center">Bình luận</TableHead>
                <TableHead className="font-bold">Thời gian</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {socialLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center">
                    <Loader2 className="animate-spin w-8 h-8 mx-auto text-primary" />
                    <p className="text-xs text-foreground/40 mt-2">Đang tải dữ liệu...</p>
                  </TableCell>
                </TableRow>
              ) : posts.length > 0 ? (
                posts.slice(0, 10).map((post: any) => (
                  <TableRow key={post._id} className="hover:bg-secondary/10 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold">
                          {post.user_id?.full_name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <p className="font-bold text-xs truncate max-w-[120px]">{post.user_id?.full_name || "N/A"}</p>
                          <p className="text-[10px] text-foreground/40 font-medium">@{post.user_id?.username || "user"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs line-clamp-1 max-w-[300px] text-foreground/70">{post.content || "Không có nội dung"}</p>
                      {post.images?.length > 0 && (
                        <Badge variant="outline" className="text-[10px] p-0 h-auto font-medium text-primary mt-1 border-none bg-transparent">
                          <ImageIcon className="w-3 h-3 mr-1" /> {post.images.length} ảnh
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold px-2 py-0">
                          {post.reactionsCount || 0}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold px-2 py-0">
                        {post.commentsCount || 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[10px] font-medium text-foreground/40">
                      {new Date(post.created_at).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center text-foreground/40 italic">
                    Chưa có bài viết nào
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="p-4 border-t bg-secondary/10 text-center">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl h-8 text-xs font-bold border-indigo-100 text-indigo-600 hover:bg-indigo-50"
              onClick={() => window.location.href = "/social"}
            >
              Xem chi tiết tại Mạng xã hội <ChevronRight className="w-3 h-3 ml-1.5" />
            </Button>
          </div>
        </Card>
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
            image: { url: "", public_id: "banner" },
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
      try {
        const res = await bannersAPI.delete(bannerId)
        if (res.success) {
          refetchBanners()
        } else {
          alert(res.message)
        }
      } catch {
        alert("Lỗi xóa banner")
      } finally {
        setDeletingBannerId(null)
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
                  value={newBanner.image}
                  onChange={(img) => setNewBanner({ ...newBanner, image: img ? { url: img.url, public_id: img.public_id || "banner" } : { url: "", public_id: "banner" } })}
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
                  value={editingBanner.image}
                  onChange={(img) => setEditingBanner({ ...editingBanner, image: img ? { url: img.url, public_id: img.public_id || "banner" } : { url: "", public_id: "banner" } })}
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
                        onClick={() => setDeletingBannerId(banner._id)}
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

        {/* Delete Confirmation AlertDialog */}
        <AlertDialog open={!!deletingBannerId} onOpenChange={(open) => !open && setDeletingBannerId(null)}>
          <AlertDialogContent className="rounded-3xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận xóa banner</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn xóa banner này? Hành động này không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Hủy</AlertDialogCancel>
              <AlertDialogAction
                className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => deletingBannerId && handleDeleteBanner(deletingBannerId)}
              >
                Xóa banner
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }

  // Settings Tab
  if (activeTab === "settings") {
    return <ProfileSettings user={user} onUpdate={refreshUser} />
  }

  return null
}
