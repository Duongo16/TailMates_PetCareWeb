"use client"

import { useState, useMemo, useEffect } from "react"
import { useAdminUsers, useManagerStats } from "@/lib/hooks"
import { adminAPI } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Settings,
  Search,
  MoreVertical,
  Shield,
  User,
  Store,
  Database,
  Server,
  Loader2,
  Users,
  UserPlus,
  Clock,
  CheckCircle2,
  XCircle,
  LogIn,
  Activity,
  HardDrive,
  RefreshCw,
  AlertTriangle,
  Eye,
  UserCheck,
  UserX,
  Globe,
  Crown,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts"

interface AdminDashboardContentProps {
  activeTab: string
}

const COLORS = ["#3B6DB3", "#10B981", "#8B5CF6", "#F15A29"]

function Pagination({ currentPage, totalPages, onPageChange }: { currentPage: number, totalPages: number, onPageChange: (page: number) => void }) {
  if (totalPages <= 1) return null;
  
  return (
    <div className="flex items-center justify-center gap-2 mt-4 pb-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => onPageChange(currentPage - 1)} 
        disabled={currentPage === 1}
        className="rounded-xl h-8 px-3"
      >
        Trước
      </Button>
      <div className="flex items-center gap-1 mx-2">
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum = i + 1;
          // Adjust window if pages > 5
          if (totalPages > 5 && currentPage > 3) {
            pageNum = currentPage - 3 + i;
            if (pageNum + (4 - i) > totalPages) pageNum = totalPages - 4 + i;
          }
          if (pageNum <= 0 || pageNum > totalPages) return null;
          
          return (
            <Button
              key={pageNum}
              variant={currentPage === pageNum ? "default" : "ghost"}
              size="sm"
              onClick={() => onPageChange(pageNum)}
              className={`w-8 h-8 p-0 rounded-lg ${currentPage === pageNum ? 'bg-primary text-white hover:bg-primary/90' : 'text-foreground/60'}`}
            >
              {pageNum}
            </Button>
          )
        })}
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => onPageChange(currentPage + 1)} 
        disabled={currentPage === totalPages}
        className="rounded-xl h-8 px-3"
      >
        Sau
      </Button>
    </div>
  )
}

export function AdminDashboardContent({ activeTab }: AdminDashboardContentProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [registrationOpen, setRegistrationOpen] = useState(true)
  const [roleFilter, setRoleFilter] = useState("ALL")
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [userPage, setUserPage] = useState(1)
  const [securityPage, setSecurityPage] = useState(1)

  // Fetch data for stats and charts (larger set)
  const { data: dashboardData, isLoading: isDashboardLoading } = useAdminUsers({ limit: 100 })
  
  // Fetch paginated data for Users tab
  const { data: userData, isLoading: isUsersLoading, refetch: refetchUsers } = useAdminUsers({ 
    search: searchTerm || undefined,
    role: roleFilter !== 'ALL' ? roleFilter : undefined,
    page: userPage,
    limit: 10
  })

  // Fetch paginated data for Security/Activity tab
  const { data: securityData, isLoading: isSecurityLoading } = useAdminUsers({
    page: securityPage,
    limit: 10
  })

  const { data: managerData } = useManagerStats()
  
  const users = dashboardData?.users || []
  const stats = dashboardData?.stats || { customers: 0, merchants: 0, active: 0, pending: 0, total: 0 }
  
  const paginatedUsers = userData?.users || []
  const userPagination = userData?.pagination || { page: 1, pages: 1 }

  const activityUsers = securityData?.users || []
  const securityPagination = securityData?.pagination || { page: 1, pages: 1 }

  // Reset page when filters change
  useEffect(() => {
    setUserPage(1)
  }, [searchTerm, roleFilter])

  // Calculate total from stats
  const totalUsers = stats.total || (stats.customers + stats.merchants + stats.active)

  // User distribution for pie chart - using REAL data from API
  const userDistribution = useMemo(() => {
    // From manager stats API we get users by role
    const managerUsers = managerData?.users || {}
    
    return [
      { name: "Khách hàng", value: stats.customers || managerUsers.customer || 0, color: COLORS[0] },
      { name: "Đối tác", value: stats.merchants || managerUsers.merchant || 0, color: COLORS[1] },
      { name: "Manager", value: managerUsers.manager || 0, color: COLORS[2] },
      { name: "Admin", value: managerUsers.admin || 0, color: COLORS[3] },
    ].filter(item => item.value > 0) // Only show roles that have users
  }, [stats, managerData])

  // Activity status bar chart - using REAL data
  const activityStatusData = useMemo(() => [
    { name: "Hoạt động", value: stats.active, fill: "#10B981" },
    { name: "Chờ duyệt", value: stats.pending, fill: "#F59E0B" },
  ], [stats])

  // Filtered users based on role
  const filteredUsers = useMemo(() => {
    if (roleFilter === "ALL") return users
    return users.filter((u: any) => u.role?.toUpperCase() === roleFilter)
  }, [users, roleFilter])

  // Recent users (last 10 registered) - REAL data
  const recentUsers = useMemo(() => {
    return [...users]
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
  }, [users])

  // Registration trend data - calculated from REAL users data
  const registrationTrendData = useMemo(() => {
    const last30Days: { [key: string]: { date: string; customers: number; merchants: number } } = {}
    const now = new Date()
    
    // Initialize last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateKey = date.toISOString().split('T')[0]
      const displayDate = date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })
      last30Days[dateKey] = { date: displayDate, customers: 0, merchants: 0 }
    }
    
    // Count registrations per day from real users
    users.forEach((user: any) => {
      if (user.created_at) {
        const dateKey = new Date(user.created_at).toISOString().split('T')[0]
        if (last30Days[dateKey]) {
          if (user.role?.toUpperCase() === 'CUSTOMER') {
            last30Days[dateKey].customers++
          } else if (user.role?.toUpperCase() === 'MERCHANT') {
            last30Days[dateKey].merchants++
          }
        }
      }
    })
    
    return Object.values(last30Days)
  }, [users])


  const handleUpdateUserStatus = async (userId: string, isActive: boolean) => {
    if (!confirm(`Bạn có chắc muốn ${isActive ? "kích hoạt" : "vô hiệu hóa"} tài khoản này?`)) return
    try {
      const res = await adminAPI.updateUser(userId, { is_active: isActive })
      if (res.success) {
        refetchUsers()
        setSelectedUser(null)
      } else {
        alert(res.message)
      }
    } catch {
      alert("Lỗi cập nhật trạng thái")
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role?.toUpperCase()) {
      case "CUSTOMER":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
            <User className="w-3 h-3 mr-1" />
            Khách hàng
          </Badge>
        )
      case "MERCHANT":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            <Store className="w-3 h-3 mr-1" />
            Đối tác
          </Badge>
        )
      case "ADMIN":
        return (
          <Badge className="bg-primary/20 text-primary border-primary/30">
            <Shield className="w-3 h-3 mr-1" />
            Admin
          </Badge>
        )
      case "MANAGER":
        return (
          <Badge className="bg-purple-100 text-purple-700 border-purple-200">
            <Crown className="w-3 h-3 mr-1" />
            Manager
          </Badge>
        )
      default:
        return <Badge>{role}</Badge>
    }
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-50 text-green-600 border-green-200">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Hoạt động
      </Badge>
    ) : (
      <Badge className="bg-yellow-50 text-yellow-600 border-yellow-200">
        <Clock className="w-3 h-3 mr-1" />
        Chờ duyệt
      </Badge>
    )
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const getTimeAgo = (dateStr: string) => {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 60) return `${diffMins} phút trước`
    if (diffHours < 24) return `${diffHours} giờ trước`
    return `${diffDays} ngày trước`
  }

  // Dashboard Overview
  if (activeTab === "dashboard") {
    return (
      <div className="space-y-6 px-1 pb-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-primary/10 to-transparent p-4 md:p-6 rounded-3xl border border-primary/10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
              <p className="text-foreground/60 flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-500" />
                Quản lý hệ thống và người dùng
              </p>
            </div>
          </div>
          <Button variant="outline" className="rounded-xl gap-2" onClick={() => refetchUsers()}>
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </Button>
        </div>

        {/* User Stats Cards - REAL DATA */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="border-none shadow-sm bg-white/40 backdrop-blur-md transition-all hover:scale-[1.02] hover:shadow-md group">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center transition-transform group-hover:rotate-12">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest leading-none mb-1">Tổng Users</p>
                  <p className="text-xl font-bold text-foreground">
                    {isDashboardLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : totalUsers}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white/40 backdrop-blur-md transition-all hover:scale-[1.02] hover:shadow-md group">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center transition-transform group-hover:rotate-12">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest leading-none mb-1">Khách hàng</p>
                  <p className="text-xl font-bold text-foreground">
                    {isDashboardLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.customers}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white/40 backdrop-blur-md transition-all hover:scale-[1.02] hover:shadow-md group">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center transition-transform group-hover:rotate-12">
                  <Store className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest leading-none mb-1">Đối tác</p>
                  <p className="text-xl font-bold text-foreground">
                    {isDashboardLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.merchants}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white/40 backdrop-blur-md transition-all hover:scale-[1.02] hover:shadow-md group cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center transition-transform group-hover:rotate-12">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest leading-none mb-1">Chờ duyệt</p>
                  <p className="text-xl font-bold text-foreground">
                    {isDashboardLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.pending}
                  </p>
                </div>
              </div>
              {stats.pending > 0 && (
                <div className="mt-2">
                  <Badge className="bg-orange-100 text-orange-700 text-[10px] animate-pulse">Cần xử lý</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row - REAL DATA */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* User Distribution Pie Chart */}
          <Card className="border-none shadow-sm bg-white/40 backdrop-blur-md overflow-hidden">
            <CardHeader className="py-3 pb-2">
              <CardTitle className="flex items-center gap-2 text-primary font-bold">
                <Users className="w-5 h-5" />
                <span className="text-base">Phân bổ người dùng</span>
              </CardTitle>
              <CardDescription className="text-[10px]">Theo vai trò trong hệ thống (dữ liệu thực)</CardDescription>
            </CardHeader>
            <CardContent className="pb-3">
              {isDashboardLoading ? (
                <div className="h-[220px] flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="h-[220px] mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={userDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {userDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                          formatter={(value: number) => [`${value} người`, '']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2">
                    {userDistribution.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                        <span className="text-xs text-foreground/70 font-semibold">{item.name} ({item.value})</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Activity Status Bar Chart - REAL DATA */}
          <Card className="border-none shadow-sm bg-white/40 backdrop-blur-md overflow-hidden">
            <CardHeader className="py-3 pb-2">
              <CardTitle className="flex items-center gap-2 text-primary font-bold">
                <Activity className="w-5 h-5" />
                <span className="text-base">Trạng thái tài khoản</span>
              </CardTitle>
              <CardDescription className="text-[10px]">Active vs Pending (dữ liệu thực)</CardDescription>
            </CardHeader>
            <CardContent className="pb-3">
              {isDashboardLoading ? (
                <div className="h-[220px] flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="h-[180px] mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={activityStatusData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#374151' }} width={80} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                          formatter={(value: number) => [`${value} tài khoản`, '']}
                        />
                        <Bar dataKey="value" radius={[0, 8, 8, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-6 mt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                      <p className="text-xs text-foreground/60">Đang hoạt động</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                      <p className="text-xs text-foreground/60">Chờ duyệt</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Registration Trend Chart - REAL DATA */}
        <Card className="border-none shadow-sm bg-white/40 backdrop-blur-md overflow-hidden">
          <CardHeader className="py-3 pb-2">
            <CardTitle className="flex items-center gap-2 text-primary font-bold">
              <UserPlus className="w-5 h-5" />
              <span className="text-base">Xu hướng đăng ký</span>
            </CardTitle>
            <CardDescription className="text-[10px]">Số lượng đăng ký mới trong 30 ngày (dữ liệu thực)</CardDescription>
          </CardHeader>
          <CardContent className="pb-3">
            {isDashboardLoading ? (
              <div className="h-[250px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="h-[250px] mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={registrationTrendData}>
                      <defs>
                        <linearGradient id="colorCustomers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B6DB3" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3B6DB3" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorMerchants" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#6B7280' }}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#6B7280' }}
                        allowDecimals={false}
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                        formatter={(value: number, name: string) => [
                          `${value} người`,
                          name === 'customers' ? 'Khách hàng' : 'Đối tác'
                        ]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="customers" 
                        name="customers"
                        stroke="#3B6DB3" 
                        strokeWidth={2} 
                        fillOpacity={1} 
                        fill="url(#colorCustomers)" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="merchants" 
                        name="merchants"
                        stroke="#10B981" 
                        strokeWidth={2} 
                        fillOpacity={1} 
                        fill="url(#colorMerchants)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#3B6DB3]" />
                    <span className="text-sm text-foreground/70">Khách hàng</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#10B981]" />
                    <span className="text-sm text-foreground/70">Đối tác</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Quick Settings */}
        <Card className="border-none shadow-sm bg-white/40 backdrop-blur-md">
          <CardHeader className="py-3 pb-2">
            <CardTitle className="flex items-center gap-2 text-primary font-bold">
              <Settings className="w-5 h-5" />
              <span className="text-base">Cài đặt nhanh</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 transition-all hover:bg-secondary/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Chế độ bảo trì</p>
                  <p className="text-sm text-foreground/60">Tạm dừng truy cập để bảo trì hệ thống</p>
                </div>
              </div>
              <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 transition-all hover:bg-secondary/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Đăng ký mới</p>
                  <p className="text-sm text-foreground/60">Cho phép người dùng đăng ký tài khoản mới</p>
                </div>
              </div>
              <Switch checked={registrationOpen} onCheckedChange={setRegistrationOpen} />
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border-none shadow-sm bg-white/40 backdrop-blur-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <Server className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Server</p>
                    <p className="text-sm text-green-600">Hoạt động bình thường</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-600">Online</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white/40 backdrop-blur-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Database className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Database</p>
                    <p className="text-sm text-blue-600">Kết nối ổn định</p>
                  </div>
                </div>
                <Badge className="bg-blue-100 text-blue-600">OK</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white/40 backdrop-blur-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <HardDrive className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Backup</p>
                    <p className="text-sm text-foreground/60">Tự động hàng ngày</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="rounded-xl gap-1">
                  <RefreshCw className="w-3 h-3" />
                  Backup
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Registrations - REAL DATA */}
        <Card className="border-none shadow-sm bg-white/40 backdrop-blur-md">
          <CardHeader className="py-3 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-primary font-bold">
                <UserPlus className="w-5 h-5" />
                <span className="text-base">Đăng ký gần đây</span>
              </CardTitle>
              <Badge variant="outline" className="text-xs">{recentUsers.length} mới nhất</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isDashboardLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : recentUsers.length === 0 ? (
              <div className="text-center py-8 text-foreground/50">
                Chưa có người dùng nào
              </div>
            ) : (
              <div className="space-y-2">
                {recentUsers.slice(0, 5).map((user: any) => (
                  <div key={user._id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {user.full_name?.charAt(0) || "U"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{user.full_name}</p>
                        <p className="text-xs text-foreground/50">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getRoleBadge(user.role)}
                      <span className="text-xs text-foreground/40">{getTimeAgo(user.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Users Tab
  if (activeTab === "users") {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-7 h-7 text-primary" />
            Quản lý người dùng
            <Badge variant="outline" className="ml-2">{totalUsers} users</Badge>
          </h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
            <Input
              placeholder="Tìm kiếm theo tên, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-xl w-full sm:w-64"
            />
          </div>
        </div>

        {/* Role Filter Tabs */}
        <Tabs value={roleFilter} onValueChange={setRoleFilter}>
          <TabsList className="bg-white/50 rounded-xl p-1">
            <TabsTrigger value="ALL" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
              Tất cả ({totalUsers})
            </TabsTrigger>
            <TabsTrigger value="CUSTOMER" className="rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              Khách hàng ({stats.customers})
            </TabsTrigger>
            <TabsTrigger value="MERCHANT" className="rounded-lg data-[state=active]:bg-green-500 data-[state=active]:text-white">
              Đối tác ({stats.merchants})
            </TabsTrigger>
            <TabsTrigger value="MANAGER" className="rounded-lg data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              Manager
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Card className="border-none shadow-sm bg-white/40 backdrop-blur-md">
          <CardContent className="p-0">
            {isUsersLoading ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-foreground/60 font-medium">Người dùng</th>
                        <th className="text-left py-3 px-4 text-foreground/60 font-medium hidden sm:table-cell">Email</th>
                        <th className="text-left py-3 px-4 text-foreground/60 font-medium">Vai trò</th>
                        <th className="text-left py-3 px-4 text-foreground/60 font-medium">Trạng thái</th>
                        <th className="text-left py-3 px-4 text-foreground/60 font-medium hidden md:table-cell">Ngày tạo</th>
                        <th className="text-right py-3 px-4"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedUsers.map((user: any) => (
                        <tr key={user._id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                {user.full_name?.charAt(0) || "U"}
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{user.full_name}</p>
                                <p className="text-xs text-foreground/50 sm:hidden">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-foreground/80 hidden sm:table-cell">{user.email}</td>
                          <td className="py-3 px-4">{getRoleBadge(user.role)}</td>
                          <td className="py-3 px-4">{getStatusBadge(user.is_active)}</td>
                          <td className="py-3 px-4 hidden md:table-cell text-sm text-foreground/60">
                            {formatDate(user.created_at)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-full">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl">
                                <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Xem chi tiết
                                </DropdownMenuItem>
                                {user.is_active ? (
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleUpdateUserStatus(user._id, false)}
                                  >
                                    <UserX className="w-4 h-4 mr-2" />
                                    Vô hiệu hóa
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    className="text-green-600"
                                    onClick={() => handleUpdateUserStatus(user._id, true)}
                                  >
                                    <UserCheck className="w-4 h-4 mr-2" />
                                    Kích hoạt
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                      {paginatedUsers.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-foreground/50">
                            Không tìm thấy người dùng
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 border-t border-border/50">
                  <Pagination 
                    currentPage={userPage} 
                    totalPages={userPagination.pages} 
                    onPageChange={setUserPage} 
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* User Detail Dialog */}
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="rounded-3xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Chi tiết người dùng</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-secondary/30 rounded-xl">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
                    {selectedUser.full_name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <p className="font-bold text-lg">{selectedUser.full_name}</p>
                    <p className="text-sm text-foreground/60">{selectedUser.email}</p>
                    <div className="flex gap-2 mt-2">
                      {getRoleBadge(selectedUser.role)}
                      {getStatusBadge(selectedUser.is_active)}
                    </div>
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="flex justify-between p-3 bg-secondary/20 rounded-lg">
                    <span className="text-foreground/60">Số điện thoại</span>
                    <span className="font-medium">{selectedUser.phone_number || "Chưa cập nhật"}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-secondary/20 rounded-lg">
                    <span className="text-foreground/60">Ngày tạo</span>
                    <span className="font-medium">{formatDate(selectedUser.created_at)}</span>
                  </div>
                  {selectedUser.role === "MERCHANT" && selectedUser.merchant_profile && (
                    <div className="flex justify-between p-3 bg-secondary/20 rounded-lg">
                      <span className="text-foreground/60">Tên cửa hàng</span>
                      <span className="font-medium">{selectedUser.merchant_profile.shop_name || "Chưa cập nhật"}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {selectedUser.is_active ? (
                    <Button
                      variant="destructive"
                      className="flex-1 rounded-xl"
                      onClick={() => handleUpdateUserStatus(selectedUser._id, false)}
                    >
                      <UserX className="w-4 h-4 mr-2" />
                      Vô hiệu hóa
                    </Button>
                  ) : (
                    <Button
                      className="flex-1 rounded-xl bg-green-500 hover:bg-green-600"
                      onClick={() => handleUpdateUserStatus(selectedUser._id, true)}
                    >
                      <UserCheck className="w-4 h-4 mr-2" />
                      Kích hoạt tài khoản
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Settings Tab
  if (activeTab === "settings") {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="w-7 h-7 text-primary" />
          Cài đặt hệ thống
        </h1>

        <div className="grid gap-4">
          <Card className="border-none shadow-sm bg-white/40 backdrop-blur-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Database className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Sao lưu dữ liệu</p>
                    <p className="text-sm text-foreground/60">Lần cuối: {new Date().toLocaleDateString("vi-VN")} - 14:30</p>
                  </div>
                </div>
                <Button className="rounded-xl gap-2">
                  <HardDrive className="w-4 h-4" />
                  Sao lưu ngay
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white/40 backdrop-blur-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <Server className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Trạng thái Server</p>
                    <p className="text-sm text-green-600">Hoạt động bình thường</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-600">Online</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white/40 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-base">Cài đặt chung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                <div>
                  <p className="font-medium text-foreground">Chế độ bảo trì</p>
                  <p className="text-sm text-foreground/60">Tạm dừng truy cập hệ thống</p>
                </div>
                <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                <div>
                  <p className="font-medium text-foreground">Cho phép đăng ký mới</p>
                  <p className="text-sm text-foreground/60">Mở/đóng đăng ký tài khoản</p>
                </div>
                <Switch checked={registrationOpen} onCheckedChange={setRegistrationOpen} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Security Tab
  if (activeTab === "security") {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Shield className="w-7 h-7 text-primary" />
          Bảo mật
        </h1>

        <Card className="border-none shadow-sm bg-white/40 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Lịch sử hoạt động người dùng
            </CardTitle>
            <CardDescription>Các thay đổi trạng thái tài khoản gần đây</CardDescription>
          </CardHeader>
          <CardContent>
            {isSecurityLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {activityUsers.map((user: any) => (
                    <div key={user._id} className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <Badge className={user.is_active ? "bg-green-50 text-green-600" : "bg-yellow-50 text-yellow-600"}>
                          {user.is_active ? <UserCheck className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                          {user.is_active ? "Đã kích hoạt" : "Chờ duyệt"}
                        </Badge>
                        <div>
                          <p className="font-medium text-foreground">{user.full_name}</p>
                          <p className="text-sm text-foreground/60">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-foreground/60">{getTimeAgo(user.created_at)}</p>
                        {getRoleBadge(user.role)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <Pagination 
                    currentPage={securityPage} 
                    totalPages={securityPagination.pages} 
                    onPageChange={setSecurityPage} 
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white/40 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              Cảnh báo bảo mật
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-xl bg-green-50 border border-green-200">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-700">Không có cảnh báo</p>
                  <p className="text-sm text-green-600">Hệ thống đang hoạt động an toàn</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
