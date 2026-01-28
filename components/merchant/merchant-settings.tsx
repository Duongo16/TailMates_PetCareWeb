"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { authAPI } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ImageUpload } from "@/components/ui/image-upload"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { User, Mail, Phone, Lock, Save, Loader2, MapPin, AlertCircle, Bell, Store, Star, Globe, Clock, Facebook, Instagram, Plus, X } from "lucide-react"
import Image from "next/image"
import { MERCHANT_CATEGORIES } from "@/lib/merchant-constants"

interface MerchantSettingsProps {
    onUpdate?: () => void
}

export function MerchantSettings({ onUpdate }: MerchantSettingsProps) {
    const { user, refreshUser } = useAuth()

    const [profileData, setProfileData] = useState({
        full_name: "",
        phone_number: "",
        avatar_url: "",
        avatar_public_id: "",
    })

    const [shopData, setShopData] = useState({
        shop_name: "",
        address: "",
        description: "",
        website: "",
        working_hours: "",
        categories: [] as string[],
        banners: [] as { url: string; public_id?: string }[],
        social_links: {
            facebook: "",
            instagram: "",
            zalo: "",
        }
    })

    const [passwordData, setPasswordData] = useState({
        current_password: "",
        new_password: "",
        confirm_password: "",
    })

    const [preferences, setPreferences] = useState({
        notifications: { email: true, sms: false, push: true },
    })

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isChangingPassword, setIsChangingPassword] = useState(false)
    const [showPasswordDialog, setShowPasswordDialog] = useState(false)
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

    useEffect(() => {
        if (user) {
            setProfileData({
                full_name: user.name || "",
                phone_number: user.phone_number || "",
                avatar_url: user.avatar || "",
                avatar_public_id: "",
            })
            setShopData({
                shop_name: user.merchant_profile?.shop_name || "",
                address: user.merchant_profile?.address || "",
                description: user.merchant_profile?.description || "",
                website: user.merchant_profile?.website || "",
                working_hours: user.merchant_profile?.working_hours || "",
                categories: user.merchant_profile?.categories || [],
                banners: user.merchant_profile?.banners || [],
                social_links: {
                    facebook: user.merchant_profile?.social_links?.facebook || "",
                    instagram: user.merchant_profile?.social_links?.instagram || "",
                    zalo: user.merchant_profile?.social_links?.zalo || "",
                }
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
                preferences,
                merchant_profile: {
                    shop_name: shopData.shop_name,
                    address: shopData.address,
                    description: shopData.description,
                    website: shopData.website,
                    working_hours: shopData.working_hours,
                    categories: shopData.categories,
                    banners: shopData.banners,
                    social_links: shopData.social_links,
                    rating: user?.merchant_profile?.rating || 0,
                    revenue_stats: user?.merchant_profile?.revenue_stats || 0,
                },
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
                await refreshUser()
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
                    <p className="text-foreground/60 text-sm">Quản lý thông tin cá nhân và cửa hàng</p>
                </div>
                <div className="flex items-center gap-2">
                    {user?.merchant_profile?.rating !== undefined && (
                        <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-yellow-50 border border-yellow-200">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-bold text-yellow-700">{user.merchant_profile.rating.toFixed(1)}</span>
                        </div>
                    )}
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
                {/* Left Column - Shop Info */}
                <Card className="border-primary/30 h-fit">
                    <CardHeader className="py-3 px-4">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Store className="w-4 h-4 text-primary" />
                            Thông tin cửa hàng
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 px-4 pb-4">
                        <div>
                            <Label className="text-xs flex items-center gap-1">
                                <Store className="w-3 h-3" /> Tên cửa hàng <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                value={shopData.shop_name}
                                onChange={(e) => setShopData({ ...shopData, shop_name: e.target.value })}
                                placeholder="VD: PetCare Shop"
                                className="rounded-lg h-9 mt-1"
                            />
                        </div>
                        <div>
                            <Label className="text-xs flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> Địa chỉ <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                value={shopData.address}
                                onChange={(e) => setShopData({ ...shopData, address: e.target.value })}
                                placeholder="VD: 123 Đường ABC, Quận 1, TP.HCM"
                                className="rounded-lg h-9 mt-1"
                            />
                        </div>
                        <div>
                            <Label className="text-xs">Mô tả cửa hàng</Label>
                            <Textarea
                                value={shopData.description}
                                onChange={(e) => setShopData({ ...shopData, description: e.target.value })}
                                placeholder="Mô tả về cửa hàng..."
                                className="rounded-lg mt-1 resize-none"
                                rows={2}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs flex items-center gap-1">
                                    <Globe className="w-3 h-3" /> Website
                                </Label>
                                <Input
                                    value={shopData.website}
                                    onChange={(e) => setShopData({ ...shopData, website: e.target.value })}
                                    placeholder="https://..."
                                    className="rounded-lg h-9 mt-1"
                                />
                            </div>
                            <div>
                                <Label className="text-xs flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Giờ làm việc
                                </Label>
                                <Input
                                    value={shopData.working_hours}
                                    onChange={(e) => setShopData({ ...shopData, working_hours: e.target.value })}
                                    placeholder="VD: 08:00 - 20:00"
                                    className="rounded-lg h-9 mt-1"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-foreground/40">Lĩnh vực hoạt động</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {MERCHANT_CATEGORIES.map((cat) => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => {
                                            const isSelected = shopData.categories.includes(cat.id);
                                            if (isSelected) {
                                                setShopData({ ...shopData, categories: shopData.categories.filter(c => c !== cat.id) });
                                            } else {
                                                setShopData({ ...shopData, categories: [...shopData.categories, cat.id] });
                                            }
                                        }}
                                        className={`flex items-center justify-center py-2 px-1 rounded-lg border text-[10px] font-bold transition-all ${shopData.categories.includes(cat.id)
                                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                            : "bg-background border-border text-foreground/50 hover:border-primary/50"
                                            }`}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Social Links */}
                        <div className="pt-2 border-t space-y-2">
                            <h4 className="font-medium text-xs text-foreground/70">Mạng xã hội</h4>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="relative">
                                    <Facebook className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground/40" />
                                    <Input
                                        value={shopData.social_links.facebook}
                                        onChange={(e) => setShopData({ ...shopData, social_links: { ...shopData.social_links, facebook: e.target.value } })}
                                        className="pl-7 h-8 text-xs rounded-lg"
                                        placeholder="Facebook"
                                    />
                                </div>
                                <div className="relative">
                                    <Instagram className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground/40" />
                                    <Input
                                        value={shopData.social_links.instagram}
                                        onChange={(e) => setShopData({ ...shopData, social_links: { ...shopData.social_links, instagram: e.target.value } })}
                                        className="pl-7 h-8 text-xs rounded-lg"
                                        placeholder="Instagram"
                                    />
                                </div>
                                <div className="relative flex items-center">
                                    <span className="absolute left-2.5 text-[10px] font-bold text-foreground/40">Z</span>
                                    <Input
                                        value={shopData.social_links.zalo}
                                        onChange={(e) => setShopData({ ...shopData, social_links: { ...shopData.social_links, zalo: e.target.value } })}
                                        className="pl-7 h-8 text-xs rounded-lg"
                                        placeholder="Zalo"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Banners */}
                        <div className="pt-4 border-t space-y-2">
                            <Label className="text-xs">Ảnh bìa (Banner, tối đa 5 ảnh)</Label>
                            <div className="grid grid-cols-4 gap-2">
                                {shopData.banners.map((banner, index) => (
                                    <div key={index} className="relative aspect-video rounded-lg overflow-hidden border bg-muted">
                                        <Image src={banner.url} alt={`Banner ${index}`} fill className="object-cover" />
                                        <button
                                            onClick={() => setShopData({ ...shopData, banners: shopData.banners.filter((_, i) => i !== index) })}
                                            className="absolute top-1 right-1 p-0.5 bg-black/50 text-white rounded-full hover:bg-black/70"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                {shopData.banners.length < 5 && (
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <button className="aspect-video rounded-lg border-2 border-dashed flex items-center justify-center text-foreground/40 hover:text-primary hover:border-primary transition-colors">
                                                <Plus className="w-5 h-5" />
                                            </button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-md">
                                            <DialogHeader>
                                                <DialogTitle>Thêm ảnh bìa</DialogTitle>
                                            </DialogHeader>
                                            <ImageUpload
                                                onChange={(img) => {
                                                    if (img) {
                                                        const newBanner = { url: img.url, public_id: img.public_id };
                                                        setShopData(prev => ({ ...prev, banners: [...prev.banners, newBanner] }));
                                                    }
                                                }}
                                            />
                                        </DialogContent>
                                    </Dialog>
                                )}
                            </div>
                        </div>

                        {/* Notifications inline */}
                        <div className="pt-2 border-t space-y-2">
                            <h4 className="font-medium text-xs flex items-center gap-1 text-foreground/70">
                                <Bell className="w-3 h-3" /> Thông báo đơn hàng
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
                        </div>
                    </CardContent>
                </Card>

                {/* Right Column - Personal Info */}
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
                            value={profileData.avatar_url}
                            onChange={(img) => {
                                if (img) {
                                    setProfileData({
                                        ...profileData,
                                        avatar_url: img.url,
                                        avatar_public_id: img.public_id || profileData.avatar_public_id
                                    })
                                } else {
                                    setProfileData({
                                        ...profileData,
                                        avatar_url: "",
                                        avatar_public_id: ""
                                    })
                                }
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
