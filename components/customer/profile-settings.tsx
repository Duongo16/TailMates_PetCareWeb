"use client"

import { useState, useEffect } from "react"
import { authAPI } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Mail, Phone, Lock, Camera, Save, Loader2 } from "lucide-react"

interface ProfileSettingsProps {
  user: any
  onUpdate?: () => void
}

export function ProfileSettings({ user, onUpdate }: ProfileSettingsProps) {
  const [profileData, setProfileData] = useState({
    full_name: "",
    phone_number: "",
    avatar_url: "",
  })
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.full_name || "",
        phone_number: user.phone_number || "",
        avatar_url: user.avatar?.url || "",
      })
    }
  }, [user])

  const handleUpdateProfile = async () => {
    setIsSubmitting(true)
    setMessage(null)
    try {
      const updateData: any = {
        full_name: profileData.full_name,
        phone_number: profileData.phone_number,
      }
      if (profileData.avatar_url) {
        updateData.avatar = { url: profileData.avatar_url, public_id: user?.avatar?.public_id || `avatar_${Date.now()}` }
      }

      const res = await authAPI.updateProfile(updateData)
      if (res.success) {
        setMessage({ type: "success", text: "Cập nhật thành công!" })
        onUpdate?.()
      } else {
        setMessage({ type: "error", text: res.message || "Cập nhật thất bại" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Lỗi khi cập nhật" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage({ type: "error", text: "Mật khẩu mới không khớp" })
      return
    }
    if (passwordData.new_password.length < 6) {
      setMessage({ type: "error", text: "Mật khẩu mới phải có ít nhất 6 ký tự" })
      return
    }

    setIsChangingPassword(true)
    setMessage(null)
    try {
      const res = await authAPI.updateProfile({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      })
      if (res.success) {
        setMessage({ type: "success", text: "Đổi mật khẩu thành công!" })
        setPasswordData({ current_password: "", new_password: "", confirm_password: "" })
      } else {
        setMessage({ type: "error", text: res.message || "Đổi mật khẩu thất bại" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Lỗi khi đổi mật khẩu" })
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Cài đặt tài khoản</h1>
        <p className="text-foreground/60">Quản lý thông tin cá nhân của bạn</p>
      </div>

      {/* Message Alert */}
      {message && (
        <div
          className={`p-4 rounded-xl ${
            message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Profile Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Thông tin cá nhân
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profileData.avatar_url || user?.avatar?.url} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {profileData.full_name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer">
                <Camera className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <Label>URL Ảnh đại diện</Label>
              <Input
                value={profileData.avatar_url}
                onChange={(e) => setProfileData({ ...profileData, avatar_url: e.target.value })}
                placeholder="https://example.com/avatar.jpg"
                className="rounded-xl mt-1"
              />
            </div>
          </div>

          {/* Name */}
          <div>
            <Label className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Họ và tên
            </Label>
            <Input
              value={profileData.full_name}
              onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
              placeholder="Nguyễn Văn A"
              className="rounded-xl mt-1"
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <Label className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </Label>
            <Input value={user?.email || ""} disabled className="rounded-xl mt-1 bg-secondary/50" />
            <p className="text-xs text-foreground/50 mt-1">Email không thể thay đổi</p>
          </div>

          {/* Phone */}
          <div>
            <Label className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Số điện thoại
            </Label>
            <Input
              value={profileData.phone_number}
              onChange={(e) => setProfileData({ ...profileData, phone_number: e.target.value })}
              placeholder="0901234567"
              className="rounded-xl mt-1"
            />
          </div>

          <Button className="w-full rounded-xl" onClick={handleUpdateProfile} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Lưu thay đổi</>}
          </Button>
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            Đổi mật khẩu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Mật khẩu hiện tại</Label>
            <Input
              type="password"
              value={passwordData.current_password}
              onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
              placeholder="••••••••"
              className="rounded-xl mt-1"
            />
          </div>
          <div>
            <Label>Mật khẩu mới</Label>
            <Input
              type="password"
              value={passwordData.new_password}
              onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
              placeholder="••••••••"
              className="rounded-xl mt-1"
            />
          </div>
          <div>
            <Label>Xác nhận mật khẩu mới</Label>
            <Input
              type="password"
              value={passwordData.confirm_password}
              onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
              placeholder="••••••••"
              className="rounded-xl mt-1"
            />
          </div>
          <Button
            variant="outline"
            className="w-full rounded-xl bg-transparent"
            onClick={handleChangePassword}
            disabled={isChangingPassword || !passwordData.current_password || !passwordData.new_password}
          >
            {isChangingPassword ? <Loader2 className="animate-spin" /> : "Đổi mật khẩu"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
