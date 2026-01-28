"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    MapPin,
    Phone,
    Globe,
    Star,
    Clock,
    ArrowLeft,
    Share2,
    Heart,
    Loader2,
    ChevronRight,
    Facebook,
    Instagram,
    ExternalLink,
    MessageSquare
} from "lucide-react"
import Image from "next/image"
import { motion } from "framer-motion"

export default function MerchantDetailPage() {
    const { id } = useParams()
    const router = useRouter()
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const formatUrl = (url: string) => {
        if (!url) return ""
        if (url.startsWith("http://") || url.startsWith("https://")) return url
        return `https://${url}`
    }

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await fetch(`/api/v1/merchants/${id}`)
                const result = await res.json()
                if (result.success) {
                    setData(result.data)
                }
            } catch (error) {
                console.error("Failed to fetch merchant detail:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchDetail()
    }, [id])

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <SiteHeader />
                <div className="flex flex-col items-center justify-center py-40 gap-4">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <p className="text-foreground/60 font-medium">Đang tải thông tin đối tác...</p>
                </div>
            </div>
        )
    }

    if (!data || !data.merchant) {
        return (
            <div className="min-h-screen bg-background">
                <SiteHeader />
                <div className="max-w-7xl mx-auto px-4 py-20 text-center">
                    <h1 className="text-2xl font-bold">Không tìm thấy thông tin đối tác</h1>
                    <Button variant="link" onClick={() => router.push("/merchants")} className="mt-4">
                        Quay lại danh sách
                    </Button>
                </div>
            </div>
        )
    }

    const { merchant, services } = data
    const { merchant_profile } = merchant

    return (
        <div className="min-h-screen bg-background">
            <SiteHeader />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Navigation Breadcrumb-like */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-foreground/60 hover:text-primary transition-colors mb-6 group font-medium"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Quay lại danh sách
                </button>

                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-6">
                        <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-card shadow-xl ring-2 ring-primary/10">
                            <AvatarImage src={merchant.avatar?.url || "/placeholder.svg"} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
                                {merchant_profile.shop_name.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-3xl font-bold text-foreground">{merchant_profile.shop_name}</h1>
                                <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-lg text-yellow-700 font-bold text-sm">
                                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                    {merchant_profile.rating ? merchant_profile.rating.toFixed(1) : "0.0"}
                                </div>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-foreground/60">
                                <span className="flex items-center gap-1.5 text-sm font-medium">
                                    <MapPin className="w-4 h-4 text-primary" />
                                    {merchant_profile.address}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="icon" className="rounded-xl">
                            <Share2 className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive">
                            <Heart className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Gallery/Banners */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-12 h-[300px] sm:h-[450px]">
                    <div className="md:col-span-8 relative rounded-3xl overflow-hidden shadow-2xl group">
                        <Image
                            src={merchant_profile.banners?.[0]?.url || "/images/placeholder-banner.jpg"}
                            alt="Merchant Banner Main"
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                    </div>
                    <div className="hidden md:flex md:col-span-4 flex-col gap-4">
                        <div className="flex-1 relative rounded-3xl overflow-hidden shadow-xl group">
                            <Image
                                src={merchant_profile.banners?.[1]?.url || "/images/placeholder-banner.jpg"}
                                alt="Merchant Banner 2"
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                        </div>
                        <div className="flex-1 relative rounded-3xl overflow-hidden shadow-xl group">
                            <Image
                                src={merchant_profile.banners?.[2]?.url || "/images/placeholder-banner.jpg"}
                                alt="Merchant Banner 3"
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                            {merchant_profile.banners?.length > 3 && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <span className="text-white font-bold text-xl">+{merchant_profile.banners.length - 3} ảnh</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid lg:grid-cols-12 gap-8">
                    {/* Left Column - Main Info */}
                    <div className="lg:col-span-8 space-y-12">
                        {/* About Section */}
                        <section>
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                <Badge className="w-2 h-6 rounded-full bg-primary p-0" />
                                Giới thiệu
                            </h2>
                            <p className="text-lg text-foreground/70 leading-relaxed whitespace-pre-wrap">
                                {merchant_profile.description || "Chưa có mô tả giới thiệu cho đối tác này."}
                            </p>

                            <div className="flex flex-wrap gap-2 mt-6">
                                {merchant_profile.categories?.map((cat: string) => (
                                    <Badge key={cat} variant="secondary" className="px-4 py-1.5 rounded-full text-sm">
                                        {cat}
                                    </Badge>
                                ))}
                            </div>
                        </section>

                        {/* Services List */}
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    <Badge className="w-2 h-6 rounded-full bg-primary p-0" />
                                    Dịch vụ cung cấp
                                </h2>
                                <Badge variant="outline" className="text-primary border-primary/20">
                                    {services.length} dịch vụ
                                </Badge>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {services.length > 0 ? (
                                    services.map((service: any) => (
                                        <Card key={service._id} className="border-border hover:border-primary/40 transition-all group cursor-pointer overflow-hidden rounded-2xl">
                                            <div className="relative h-40">
                                                <Image
                                                    src={service.image?.url || "/images/placeholder-service.jpg"}
                                                    alt={service.name}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                                <div className="absolute top-3 right-3">
                                                    <Badge className="bg-card/80 backdrop-blur-sm text-foreground border-border">
                                                        {service.category}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <CardContent className="p-4">
                                                <h3 className="font-bold group-hover:text-primary transition-colors">{service.name}</h3>
                                                <p className="text-xs text-foreground/50 mt-1 line-clamp-1">{service.description}</p>
                                                <div className="flex items-center justify-between mt-4">
                                                    <div className="text-primary font-bold">
                                                        {service.price_min.toLocaleString()}đ - {service.price_max.toLocaleString()}đ
                                                    </div>
                                                    <div className="text-[10px] text-foreground/40 font-medium">
                                                        {service.duration_minutes} phút
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                ) : (
                                    <div className="col-span-full py-10 text-center bg-muted/30 rounded-3xl border-2 border-dashed border-border">
                                        <p className="text-foreground/50 font-medium">Hiện chưa cập nhật dịch vụ nào.</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Right Column - Sidebar */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Contact Card */}
                        <Card className="rounded-[2.5rem] border-primary/20 shadow-2xl shadow-primary/5 sticky top-24 overflow-hidden bg-white dark:bg-card">
                            <div className="h-2.5 bg-primary w-full" />
                            <CardHeader className="pt-8 pb-4 px-8">
                                <CardTitle className="text-2xl font-bold text-foreground">Thông tin liên hệ</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-8 px-8 pb-10">
                                <div className="space-y-6">
                                    <div className="flex gap-5 items-center">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                            <Phone className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-foreground/40 font-bold uppercase tracking-wider">Số điện thoại</p>
                                            <p className="font-bold text-foreground text-lg">{merchant.phone_number || "Chưa cập nhật"}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-5 items-center">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                            <Globe className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-foreground/40 font-bold uppercase tracking-wider">Website</p>
                                            {merchant_profile.website ? (
                                                <a
                                                    href={formatUrl(merchant_profile.website)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-bold text-primary hover:underline flex items-center gap-1.5 text-lg"
                                                >
                                                    Truy cập Website <ExternalLink className="w-4 h-4" />
                                                </a>
                                            ) : (
                                                <p className="font-bold text-foreground text-lg">Chưa cập nhật</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-5 items-center">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                            <Clock className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-foreground/40 font-bold uppercase tracking-wider">Giờ hoạt động</p>
                                            <p className="font-bold text-foreground text-lg">{merchant_profile.working_hours || "08:00 - 20:00"}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4 pt-4">
                                    <Button
                                        className="w-full h-14 rounded-2xl text-xl font-bold shadow-xl shadow-primary/25 bg-primary hover:bg-primary/90 transition-all active:scale-95"
                                        onClick={() => {
                                            router.push(`/dashboard/customer?tab=messages&type=COMMERCE&participantId=${merchant._id}`);
                                        }}
                                    >
                                        <MessageSquare className="w-6 h-6 mr-2" />
                                        Nhắn tin (Chat)
                                    </Button>
                                    <Button asChild className="w-full h-14 rounded-2xl text-xl font-bold border-2 border-primary/20 text-primary bg-transparent hover:bg-primary/5 transition-all active:scale-95">
                                        <a href={`tel:${merchant.phone_number}`}>Gọi ngay</a>
                                    </Button>
                                    <Button asChild variant="outline" className="w-full h-14 rounded-2xl font-bold text-lg border-2 hover:bg-primary hover:text-white transition-all active:scale-95">
                                        {merchant_profile.social_links?.zalo ? (
                                            <a
                                                href={`https://zalo.me/${merchant_profile.social_links.zalo.replace(/^0/, '84')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Nhắn tin (Zalo)
                                            </a>
                                        ) : (
                                            <a href={`mailto:${merchant.email}`}>
                                                Gửi Email
                                            </a>
                                        )}
                                    </Button>
                                </div>

                                {merchant_profile.social_links && (
                                    <div className="pt-8 flex justify-center gap-8 border-t border-border/50">
                                        {merchant_profile.social_links.facebook && (
                                            <a
                                                href={formatUrl(merchant_profile.social_links.facebook)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-foreground/30 hover:text-blue-600 transition-all hover:scale-110"
                                            >
                                                <Facebook className="w-7 h-7" />
                                            </a>
                                        )}
                                        {merchant_profile.social_links.instagram && (
                                            <a
                                                href={formatUrl(merchant_profile.social_links.instagram)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-foreground/30 hover:text-pink-600 transition-all hover:scale-110"
                                            >
                                                <Instagram className="w-7 h-7" />
                                            </a>
                                        )}
                                        {merchant_profile.social_links.zalo && (
                                            <a
                                                href={formatUrl(merchant_profile.social_links.zalo.startsWith('http') ? merchant_profile.social_links.zalo : `zalo.me/${merchant_profile.social_links.zalo.replace(/^0/, '84')}`)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-foreground/30 hover:text-blue-500 transition-all hover:scale-110 flex items-center justify-center font-bold text-2xl"
                                                style={{ width: '28px', height: '28px' }}
                                            >
                                                Z
                                            </a>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main >
        </div >
    )
}
