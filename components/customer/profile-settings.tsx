"use client"

import { useState, useEffect } from "react"
import { authAPI } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { ImageUpload } from "@/components/ui/image-upload"
import { Progress } from "@/components/ui/progress"
import { User, Mail, Phone, Lock, Save, Loader2, MapPin, AlertCircle, Globe, Bell } from "lucide-react"

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
    emergency_contact: {
      name: "",
      phone: "",
      relationship: "",
    },
    preferences: {
      language: "vi",
      notifications: {
        email: true,
        sms: false,
        push: true,
      },
      newsletter: false,
    },
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
        avatar_public_id: user.avatar?.public_id || "",
        address: {
          street: user.address?.street || "",
          city: user.address?.city || "",
          postal_code: user.address?.postal_code || "",
        },
        emergency_contact: {
          name: user.emergency_contact?.name || "",
          phone: user.emergency_contact?.phone || "",
          relationship: user.emergency_contact?.relationship || "",
        },
        preferences: {
          language: user.preferences?.language || "vi",
          notifications: {
            email: user.preferences?.notifications?.email ?? true,
            sms: user.preferences?.notifications?.sms ?? false,
            push: user.preferences?.notifications?.push ?? true,
          },
          newsletter: user.preferences?.newsletter ?? false,
        },
      })
    }
  }, [user])

  // Calculate profile completion
  const calculateCompletion = () => {
    const fields = [
      profileData.full_name,
      profileData.phone_number,
      profileData.avatar_url,
      profileData.address.street,
      profileData.address.city,
      profileData.emergency_contact.name,
      profileData.emergency_contact.phone,
    ]
    const filled = fields.filter(f => f && f.toString().trim()).length
    return Math.round((filled / fields.length) * 100)
  }

  const completion = calculateCompletion()

  const handleUpdateProfile = async () => {
    setIsSubmitting(true)
    setMessage(null)
    try {
      const updateData: any = {
        full_name: profileData.full_name,
        phone_number: profileData.phone_number,
        address: profileData.address,
        emergency_contact: profileData.emergency_contact,
        preferences: profileData.preferences,
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

      {/* Profile Completion */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold text-foreground">Độ hoàn thiện hồ sơ</p>
              <p className="text-sm text-foreground/60">Hoàn thiện hồ sơ để trải nghiệm tốt hơn</p>
            </div>
            <div className="text-2xl font-bold text-primary">{completion}%</div>
          </div>
          <Progress value={completion} className="h-2" />
        </CardContent>
      </Card>

      {/* Message Alert */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 ${message.type === "success"
              ? "bg-green-100 text-green-700 border border-green-200"
              : "bg-red-100 text-red-700 border border-red-200"
            }`}
        >
          <AlertCircle className="w-5 h-5" />
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
          {/* Avatar Upload - TOP */}
          <ImageUpload
            label="Ảnh đại diện"
            value={profileData.avatar_url}
            onChange={(url, publicId) => {
              setProfileData({
                ...profileData,
                avatar_url: url,
                avatar_public_id: publicId || profileData.avatar_public_id
              })
            }}
          />

          <Separator />

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

          <Separator />

          {/* Address Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Địa chỉ
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label>Địa chỉ</Label>
                <Input
                  value={profileData.address.street}
                  onChange={(e) => setProfileData({
                    ...profileData,
                    address: { ...profileData.address, street: e.target.value }
                  })}
                  placeholder="Số nhà, tên đường"
                  className="rounded-xl mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Thành phố</Label>
                  <Input
                    value={profileData.address.city}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      address: { ...profileData.address, city: e.target.value }
                    })}
                    placeholder="Hà Nội"
                    className="rounded-xl mt-1"
                  />
                </div>
                <div>
                  <Label>Mã bưu điện</Label>
                  <Input
                    value={profileData.address.postal_code}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      address: { ...profileData.address, postal_code: e.target.value }
                    })}
                    placeholder="100000"
                    className="rounded-xl mt-1"
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Emergency Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-primary" />
              Liên hệ khẩn cấp
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Họ tên</Label>
                <Input
                  value={profileData.emergency_contact.name}
                  onChange={(e) => setProfileData({
                    ...profileData,
                    emergency_contact: { ...profileData.emergency_contact, name: e.target.value }
                  })}
                  placeholder="Nguyễn Văn B"
                  className="rounded-xl mt-1"
                />
              </div>
              <div>
                <Label>Số điện thoại</Label>
                <Input
                  value={profileData.emergency_contact.phone}
                  onChange={(e) => setProfileData({
                    ...profileData,
                    emergency_contact: { ...profileData.emergency_contact, phone: e.target.value }
                  })}
                  placeholder="0987654321"
                  className="rounded-xl mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Mối quan hệ</Label>
                <Select
                  value={profileData.emergency_contact.relationship}
                  onValueChange={(val) => setProfileData({
                    ...profileData,
                    emergency_contact: { ...profileData.emergency_contact, relationship: val }
                  })}
                >
                  <SelectTrigger className="rounded-xl mt-1">
                    <SelectValue placeholder="Chọn mối quan hệ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parent">Cha/Mẹ</SelectItem>
                    <SelectItem value="spouse">Vợ/Chồng</SelectItem>
                    <SelectItem value="sibling">Anh/Chị/Em</SelectItem>
                    <SelectItem value="friend">Bạn bè</SelectItem>
                    <SelectItem value="other">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Button className="w-full rounded-xl" onClick={handleUpdateProfile} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Lưu thay đổi</>}
          </Button>
        </CardContent>
      </Card>

      {/* Preferences Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Tùy chọn
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Language */}
          <div>
            <Label>Ngôn ngữ</Label>
            <Select
              value={profileData.preferences.language}
              onValueChange={(val) => setProfileData({
                ...profileData,
                preferences: { ...profileData.preferences, language: val }
              })}
            >
              <SelectTrigger className="rounded-xl mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vi">Tiếng Việt</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Notifications */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Thông báo
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Email</p>
                  <p className="text-xs text-foreground/60">Nhận thông báo qua email</p>
                </div>
                <Switch
                  checked={profileData.preferences.notifications.email}
                  onCheckedChange={(checked) => setProfileData({
                    ...profileData,
                    preferences: {
                      ...profileData.preferences,
                      notifications: { ...profileData.preferences.notifications, email: checked }
                    }
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">SMS</p>
                  <p className="text-xs text-foreground/60">Nhận thông báo qua tin nhắn</p>
                </div>
                <Switch
                  checked={profileData.preferences.notifications.sms}
                  onCheckedChange={(checked) => setProfileData({
                    ...profileData,
                    preferences: {
                      ...profileData.preferences,
                      notifications: { ...profileData.preferences.notifications, sms: checked }
                    }
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Push</p>
                  <p className="text-xs text-foreground/60">Nhận thông báo đẩy</p>
                </div>
                <Switch
                  checked={profileData.preferences.notifications.push}
                  onCheckedChange={(checked) => setProfileData({
                    ...profileData,
                    preferences: {
                      ...profileData.preferences,
                      notifications: { ...profileData.preferences.notifications, push: checked }
                    }
                  })}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Newsletter */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Newsletter</p>
              <p className="text-sm text-foreground/60">Nhận tin tức và ưu đãi</p>
            </div>
            <Switch
              checked={profileData.preferences.newsletter}
              onCheckedChange={(checked) => setProfileData({
                ...profileData,
                preferences: { ...profileData.preferences, newsletter: checked }
              })}
            />
          </div>
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
