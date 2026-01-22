"use client"

import { useState, useEffect } from "react"
import { authAPI } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ImageUpload } from "@/components/ui/image-upload"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { User, Mail, Phone, Lock, Save, Loader2, MapPin, AlertCircle, Bell } from "lucide-react"

interface ProfileSettingsProps {
  user: any
  onUpdate?: () => void
}

export function ProfileSettings({ user, onUpdate }: ProfileSettingsProps) {
  const [profileData, setProfileData] = useState({
    full_name: "",
    phone_number: "",
    avatar_url: "",
    avatar_public_id: "",
    address: {
      street: "",
      city: "",
      postal_code: "",
    },
  })

  const [preferences, setPreferences] = useState({
    notifications: { email: true, sms: false, push: true },
    newsletter: false,
  })

  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.full_name || user.name || "",
        phone_number: user.phone_number || "",
        avatar_url: user.avatar?.url || user.avatar || "",
        avatar_public_id: user.avatar?.public_id || "",
        address: {
          street: user.address?.street || "",
          city: user.address?.city || "",
          postal_code: user.address?.postal_code || "",
        },
      })
      setPreferences({
        notifications: {
          email: user.preferences?.notifications?.email ?? true,
          sms: user.preferences?.notifications?.sms ?? false,
          push: user.preferences?.notifications?.push ?? true,
        },
        newsletter: user.preferences?.newsletter ?? false,
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
        address: profileData.address,
        preferences,
      }

      if (profileData.avatar_url) {
        updateData.avatar = {
          url: profileData.avatar_url,
          public_id: profileData.avatar_public_id || `avatar_${Date.now()}`
        }
      }

      const res = await authAPI.updateProfile(updateData)
      if (res.success) {
        setMessage({ type: "success", text: "Cập nhật thành công!" })
        onUpdate?.()
      } else {
        setMessage({ type: "error", text: res.message || "Cập nhật thất bại" })
      }
    } catch {
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
        setShowPasswordDialog(false)
      } else {
        setMessage({ type: "error", text: res.message || "Đổi mật khẩu thất bại" })
      }
    } catch {
      setMessage({ type: "error", text: "Lỗi khi đổi mật khẩu" })
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col gap-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-foreground">Cài đặt tài khoản</h1>
          <p className="text-foreground/60 text-sm">Quản lý thông tin cá nhân của bạn</p>
        </div>
        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-xl bg-transparent">
              <Lock className="w-4 h-4 mr-1" /> Đổi mật khẩu
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-w-sm">
            <DialogHeader>
              <DialogTitle>Đổi mật khẩu</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Mật khẩu hiện tại</Label>
                <Input
                  type="password"
                  value={passwordData.current_password}
                  onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                  placeholder="••••••••"
                  className="rounded-lg h-9 mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Mật khẩu mới</Label>
                <Input
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                  placeholder="••••••••"
                  className="rounded-lg h-9 mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Xác nhận mật khẩu</Label>
                <Input
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                  placeholder="••••••••"
                  className="rounded-lg h-9 mt-1"
                />
              </div>
              <Button
                className="w-full rounded-xl"
                onClick={handleChangePassword}
                disabled={isChangingPassword || !passwordData.current_password || !passwordData.new_password}
              >
                {isChangingPassword ? <Loader2 className="animate-spin" /> : "Xác nhận đổi mật khẩu"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Message Alert */}
      {message && (
        <div
          className={`p-3 rounded-xl flex items-center gap-2 text-sm flex-shrink-0 ${message.type === "success"
            ? "bg-green-100 text-green-700 border border-green-200"
            : "bg-red-100 text-red-700 border border-red-200"
            }`}
        >
          <AlertCircle className="w-4 h-4" />
          {message.text}
        </div>
      )}

      {/* Main Content - 2 Column Grid */}
      <div className="grid lg:grid-cols-2 gap-4 flex-1 min-h-0 overflow-auto">
        {/* Left Column - Personal Info */}
        <Card className="h-fit">
          <CardHeader className="py-3 px-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="w-4 h-4 text-primary" />
              Thông tin cá nhân
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-4 pb-4">
            {/* Avatar compact */}
            <ImageUpload
              label="Ảnh đại diện"
              value={profileData.avatar_url ? { url: profileData.avatar_url, public_id: profileData.avatar_public_id } : null}
              onChange={(image) => {
                setProfileData({
                  ...profileData,
                  avatar_url: image?.url || "",
                  avatar_public_id: image?.public_id || ""
                })
              }}
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs flex items-center gap-1">
                  <User className="w-3 h-3" /> Họ và tên
                </Label>
                <Input
                  value={profileData.full_name}
                  onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                  placeholder="Nguyễn Văn A"
                  className="rounded-lg h-9 mt-1"
                />
              </div>
              <div>
                <Label className="text-xs flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Số điện thoại
                </Label>
                <Input
                  value={profileData.phone_number}
                  onChange={(e) => setProfileData({ ...profileData, phone_number: e.target.value })}
                  placeholder="0901234567"
                  className="rounded-lg h-9 mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs flex items-center gap-1">
                <Mail className="w-3 h-3" /> Email
              </Label>
              <Input value={user?.email || ""} disabled className="rounded-lg h-9 mt-1 bg-secondary/50 text-foreground/50" />
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Address & Notifications */}
        <Card className="h-fit">
          <CardHeader className="py-3 px-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="w-4 h-4 text-primary" />
              Địa chỉ & Thông báo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-4 pb-4">
            <div>
              <Label className="text-xs">Địa chỉ</Label>
              <Input
                value={profileData.address.street}
                onChange={(e) => setProfileData({
                  ...profileData,
                  address: { ...profileData.address, street: e.target.value }
                })}
                placeholder="Số nhà, tên đường"
                className="rounded-lg h-9 mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Thành phố</Label>
                <Input
                  value={profileData.address.city}
                  onChange={(e) => setProfileData({
                    ...profileData,
                    address: { ...profileData.address, city: e.target.value }
                  })}
                  placeholder="Hà Nội"
                  className="rounded-lg h-9 mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Mã bưu điện</Label>
                <Input
                  value={profileData.address.postal_code}
                  onChange={(e) => setProfileData({
                    ...profileData,
                    address: { ...profileData.address, postal_code: e.target.value }
                  })}
                  placeholder="100000"
                  className="rounded-lg h-9 mt-1"
                />
              </div>
            </div>

            {/* Notifications inline */}
            <div className="pt-2 border-t space-y-2">
              <h4 className="font-medium text-xs flex items-center gap-1 text-foreground/70">
                <Bell className="w-3 h-3" /> Thông báo
              </h4>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs">
                  <Switch
                    checked={preferences.notifications.email}
                    onCheckedChange={(checked) => setPreferences({
                      ...preferences,
                      notifications: { ...preferences.notifications, email: checked }
                    })}
                    className="scale-75"
                  />
                  Email
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <Switch
                    checked={preferences.notifications.sms}
                    onCheckedChange={(checked) => setPreferences({
                      ...preferences,
                      notifications: { ...preferences.notifications, sms: checked }
                    })}
                    className="scale-75"
                  />
                  SMS
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <Switch
                    checked={preferences.notifications.push}
                    onCheckedChange={(checked) => setPreferences({
                      ...preferences,
                      notifications: { ...preferences.notifications, push: checked }
                    })}
                    className="scale-75"
                  />
                  Push
                </label>
              </div>
              <label className="flex items-center gap-2 text-xs pt-1">
                <Switch
                  checked={preferences.newsletter}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, newsletter: checked })}
                  className="scale-75"
                />
                Nhận tin tức & ưu đãi
              </label>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fixed Save Button */}
      <div className="flex-shrink-0 pt-2">
        <Button className="w-full rounded-xl h-11" onClick={handleUpdateProfile} disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Lưu tất cả thay đổi</>}
        </Button>
      </div>
    </div>
  )
}
