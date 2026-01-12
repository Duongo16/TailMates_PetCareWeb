"use client"

import { useState } from "react"
import { useAdminUsers } from "@/lib/hooks"
import { adminAPI } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Settings, Search, MoreVertical, Shield, User, Store, Database, Server, Loader2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface AdminDashboardContentProps {
  activeTab: string
}

export function AdminDashboardContent({ activeTab }: AdminDashboardContentProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [registrationOpen, setRegistrationOpen] = useState(true)
  
  const { data, isLoading, refetch } = useAdminUsers()
  const users = data?.users || []
  const stats = data?.stats || { customers: 0, merchants: 0, active: 0, pending: 0, total: 0 }

  const filteredUsers = users.filter(
    (user: any) =>
      (user.full_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (user.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()),
  )

  const handleUpdateUserStatus = async (userId: string, isActive: boolean) => {
    if (!confirm(`Bạn có chắc muốn ${isActive ? "kích hoạt" : "vô hiệu hóa"} tài khoản này?`)) return
    try {
      const res = await adminAPI.updateUser(userId, { is_active: isActive })
      if (res.success) {
        refetch()
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
          <Badge className="bg-secondary text-foreground">
            <User className="w-3 h-3 mr-1" />
            Khách hàng
          </Badge>
        )
      case "MERCHANT":
        return (
          <Badge className="bg-muted text-foreground">
            <Store className="w-3 h-3 mr-1" />
            Đối tác
          </Badge>
        )
      case "ADMIN":
        return (
          <Badge className="bg-primary text-primary-foreground">
            <Shield className="w-3 h-3 mr-1" />
            Admin
          </Badge>
        )
      case "MANAGER":
        return (
          <Badge className="bg-accent text-white">
            <Shield className="w-3 h-3 mr-1" />
            Manager
          </Badge>
        )
      default:
        return <Badge>{role}</Badge>
    }
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-600">Hoạt động</Badge>
    ) : (
      <Badge className="bg-primary/20 text-primary">Chờ duyệt</Badge>
    )
  }

  // Dashboard Overview
  if (activeTab === "dashboard") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings className="w-7 h-7 text-primary" />
            Admin Panel
          </h1>
          <p className="text-foreground/60">Quản lý hệ thống và người dùng</p>
        </div>

        {/* Stats */}
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-secondary/50">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-foreground">{stats.customers}</p>
                <p className="text-foreground/60 text-sm">Khách hàng</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-foreground">{stats.merchants}</p>
                <p className="text-foreground/60 text-sm">Đối tác</p>
              </CardContent>
            </Card>
            <Card className="bg-background">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-foreground">{stats.active}</p>
                <p className="text-foreground/60 text-sm">Hoạt động</p>
              </CardContent>
            </Card>
            <Card className="bg-primary/10">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-primary">{stats.pending}</p>
                <p className="text-foreground/60 text-sm">Chờ duyệt</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Cài đặt nhanh</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
              <div>
                <p className="font-medium text-foreground">Bảo trì hệ thống</p>
                <p className="text-sm text-foreground/60">Tạm dừng truy cập để bảo trì</p>
              </div>
              <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
              <div>
                <p className="font-medium text-foreground">Đăng ký Merchant mới</p>
                <p className="text-sm text-foreground/60">Cho phép đăng ký đối tác mới</p>
              </div>
              <Switch checked={registrationOpen} onCheckedChange={setRegistrationOpen} />
            </div>
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
          <h1 className="text-2xl font-bold text-foreground">Quản lý người dùng</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
            <Input
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-xl w-full sm:w-64"
            />
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-foreground/60 font-medium">Tên</th>
                      <th className="text-left py-3 px-4 text-foreground/60 font-medium hidden sm:table-cell">Email</th>
                      <th className="text-left py-3 px-4 text-foreground/60 font-medium">Vai trò</th>
                      <th className="text-left py-3 px-4 text-foreground/60 font-medium">Trạng thái</th>
                      <th className="text-right py-3 px-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user: any) => (
                      <tr key={user._id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-medium text-foreground">{user.full_name}</p>
                          <p className="text-xs text-foreground/50 sm:hidden">{user.email}</p>
                        </td>
                        <td className="py-3 px-4 text-foreground/80 hidden sm:table-cell">{user.email}</td>
                        <td className="py-3 px-4">{getRoleBadge(user.role)}</td>
                        <td className="py-3 px-4">{getStatusBadge(user.is_active)}</td>
                        <td className="py-3 px-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Xem chi tiết</DropdownMenuItem>
                              {user.is_active ? (
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => handleUpdateUserStatus(user._id, false)}
                                >
                                  Vô hiệu hóa
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem 
                                  className="text-green-600"
                                  onClick={() => handleUpdateUserStatus(user._id, true)}
                                >
                                  Kích hoạt
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-foreground/50">
                          Không tìm thấy người dùng
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Settings Tab
  if (activeTab === "settings") {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Cài đặt hệ thống</h1>
        <div className="grid gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                    <Database className="w-6 h-6 text-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Sao lưu dữ liệu</p>
                    <p className="text-sm text-foreground/60">Lần cuối: {new Date().toLocaleDateString("vi-VN")}</p>
                  </div>
                </div>
                <Button className="rounded-xl">Sao lưu ngay</Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                    <Server className="w-6 h-6 text-foreground" />
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
        </div>
      </div>
    )
  }

  // Security Tab
  if (activeTab === "security") {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Bảo mật</h1>
        <Card>
          <CardHeader>
            <CardTitle>Nhật ký truy cập</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { action: "Đăng nhập thành công", user: "admin@tailmates.com", time: "10 phút trước" },
                { action: "Thay đổi cài đặt", user: "admin@tailmates.com", time: "1 giờ trước" },
                { action: "Đăng nhập từ IP mới", user: "petcare@clinic.com", time: "2 giờ trước" },
              ].map((log, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                  <div>
                    <p className="font-medium text-foreground">{log.action}</p>
                    <p className="text-sm text-foreground/60">{log.user}</p>
                  </div>
                  <p className="text-xs text-foreground/50">{log.time}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}

