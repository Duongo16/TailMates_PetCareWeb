"use client"

import React, { useMemo } from "react"
import {
    useMerchantAnalytics,
    useMerchantProducts,
    useMerchantPackages,
    useOrders,
    useBookings,
} from "@/lib/hooks"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ordersAPI, bookingsAPI } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts"
import {
    DollarSign,
    Coins,
    ShoppingCart,
    Calendar,
    Package,
    TrendingUp,
    TrendingDown,
    Crown,
    BarChart3,
    Clock,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Zap,
    Star,
    Users,
    Activity,
    Target,
    ChevronRight,
    Store,
    Layers,
} from "lucide-react"

interface MerchantOverviewProps {
    setActiveTab: (tab: any) => void
}

const COLORS = ["#F15A29", "#3B6DB3", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444"]

const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price)

const formatCompact = (price: number) => {
    if (price >= 1_000_000_000) return `${(price / 1_000_000_000).toFixed(1)}Tỷ`
    if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1)}M`
    if (price >= 1_000) return `${(price / 1_000).toFixed(0)}K`
    return price.toString()
}

// ────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────

function KpiCard({
    icon: Icon,
    label,
    value,
    sub,
    iconBg,
    iconColor,
    trend,
    trendPositive,
    onClick,
}: {
    icon: any
    label: string
    value: string
    sub?: string
    iconBg: string
    iconColor: string
    trend?: string
    trendPositive?: boolean
    onClick?: () => void
}) {
    return (
        <Card
            onClick={onClick}
            className={`border-none shadow-sm bg-white/50 backdrop-blur-md ${onClick ? "cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all" : ""} group`}
        >
            <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center transition-transform group-hover:rotate-6`}>
                        <Icon className={`w-5 h-5 ${iconColor}`} />
                    </div>
                    {trend && (
                        <span className={`flex items-center gap-0.5 text-[11px] font-bold ${trendPositive ? "text-green-600" : "text-red-500"}`}>
                            {trendPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {trend}
                        </span>
                    )}
                </div>
                <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest leading-none mb-1">{label}</p>
                <p className="text-xl font-black text-foreground leading-tight">{value}</p>
                {sub && <p className="text-[11px] text-foreground/50 mt-0.5">{sub}</p>}
            </CardContent>
        </Card>
    )
}

// ────────────────────────────────────────────────────────────
// Custom Tooltip for charts
// ────────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label, formatter }: any) => {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-white/95 backdrop-blur-sm border border-border/30 rounded-2xl px-4 py-3 shadow-xl text-sm">
            <p className="font-bold text-foreground/70 mb-1 text-xs">{label}</p>
            {payload.map((p: any, i: number) => (
                <p key={i} className="font-black" style={{ color: p.color }}>
                    {p.name}: {formatter ? formatter(p.value) : p.value}
                </p>
            ))}
        </div>
    )
}

// ────────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────────
export function MerchantOverview({ setActiveTab }: MerchantOverviewProps) {
    const { user } = useAuth()
    const { data: analytics, isLoading: analyticsLoading } = useMerchantAnalytics("30d")
    const { data: products } = useMerchantProducts()
    const { data: packages } = useMerchantPackages()
    const { data: orders } = useOrders()
    const { data: bookings } = useBookings()
    const { toast } = useToast()

    // ── Handlers ──────────────────────────────────────────────
    const handleUpdateOrderStatus = async (e: React.MouseEvent, orderId: string, status: string) => {
        e.stopPropagation()
        try {
            const res = await ordersAPI.updateStatus(orderId, status)
            if (res.success) {
                toast({
                    title: "Thành công",
                    description: `Đơn hàng đã được ${status === "CONFIRMED" ? "xác nhận" : status.toLowerCase()}.`,
                })
            } else {
                toast({
                    variant: "destructive",
                    title: "Lỗi",
                    description: res.message || "Không thể cập nhật trạng thái",
                })
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Lỗi hệ thống",
                description: "Đã xảy ra lỗi khi cập nhật trạng thái đơn hàng",
            })
        }
    }

    const handleUpdateBookingStatus = async (e: React.MouseEvent, bookingId: string, status: string) => {
        e.stopPropagation()
        try {
            const res = await bookingsAPI.updateStatus(bookingId, status)
            if (res.success) {
                toast({
                    title: "Thành công",
                    description: `Lịch hẹn đã được ${status === "CONFIRMED" ? "xác nhận" : status.toLowerCase()}.`,
                })
            } else {
                toast({
                    variant: "destructive",
                    title: "Lỗi",
                    description: res.message || "Không thể cập nhật trạng thái",
                })
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Lỗi hệ thống",
                description: "Đã xảy ra lỗi khi cập nhật trạng thái lịch hẹn",
            })
        }
    }

    // ── Greeting ──────────────────────────────────────────────
    const greeting = () => {
        const h = new Date().getHours()
        if (h < 12) return "Chào buổi sáng"
        if (h < 18) return "Chào buổi chiều"
        return "Chào buổi tối"
    }

    // ── Subscription info ─────────────────────────────────────
    const activeSub = user?.subscription
    const isSubActive = !!(activeSub?.package_id && activeSub?.expired_at && new Date(activeSub.expired_at) > new Date())
    const currentPackage = packages?.find((p: any) => p._id?.toString() === activeSub?.package_id?.toString())

    const daysLeft = useMemo(() => {
        if (!activeSub?.expired_at) return 0
        const diff = new Date(activeSub.expired_at).getTime() - Date.now()
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
    }, [activeSub])

    const subDurationDays = (currentPackage?.duration_months || 1) * 30
    const subProgress = Math.min(100, Math.round(((subDurationDays - daysLeft) / subDurationDays) * 100))

    // ── KPI numbers ───────────────────────────────────────────
    // Fallback: calculate revenue from orders when analytics API is blocked
    const completedOrders = orders?.filter((o: any) => ["COMPLETED", "DONE"].includes(o.status)) ?? []
    const ordersRevenue = completedOrders.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0)
    const totalRevenue = analytics?.summary?.totalRevenue ?? ordersRevenue
    const commissionRate = currentPackage?.commission_rate ?? 0.15

    // Build a product cost_price map for COGS calculation
    const productCostMap = useMemo(() => {
        const map: Record<string, number> = {}
        products?.forEach((p: any) => { map[p._id] = p.cost_price || 0 })
        return map
    }, [products])

    // Calculate COGS from completed orders
    const fallbackCOGS = useMemo(() => {
        return completedOrders.reduce((sum: number, o: any) => {
            return sum + (o.items || []).reduce((itemSum: number, item: any) => {
                const costPrice = productCostMap[item.product_id?.toString()] || 0
                return itemSum + costPrice * (item.quantity || 0)
            }, 0)
        }, 0)
    }, [completedOrders, productCostMap])

    const netIncome = analytics?.summary?.netIncome ?? Math.round(ordersRevenue - fallbackCOGS - (ordersRevenue * commissionRate))
    const totalOrders = orders?.length ?? 0
    const pendingOrders = orders?.filter((o: any) => o.status === "PENDING").length ?? 0
    const tmBalance = (user as any)?.tm_balance ?? 0

    const today = new Date()
    const todayBookings = bookings?.filter((b: any) => {
        const d = new Date(b.booking_time)
        return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
    }) ?? []
    const upcomingBookings = bookings?.filter((b: any) => ["PENDING", "CONFIRMED"].includes(b.status)) ?? []

    // ── Revenue chart data ────────────────────────────────────
    const revenueChartData = useMemo(() => {
        const cRate = currentPackage?.commission_rate ?? 0.15

        if (analytics?.chartData?.length) {
            return analytics.chartData.map((item: any) => ({
                name: item.name,
                revenue: item.revenue,
                netIncome: item.netIncome ?? Math.round(item.revenue - (item.revenue * cRate))
            }))
        }
        // Fallback: build chart from orders data (last 7 days)
        const chartDays = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(); d.setDate(d.getDate() - (6 - i))
            const dayStr = d.toLocaleDateString("vi-VN", { weekday: "short" })
            const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate())
            const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
            const dayOrders = (completedOrders || []).filter((o: any) => {
                const oDate = new Date(o.created_at)
                return oDate >= dayStart && oDate < dayEnd
            })
            const dayRevenue = dayOrders.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0)
            // Calculate COGS for this day's orders
            const dayCOGS = dayOrders.reduce((sum: number, o: any) => {
                return sum + (o.items || []).reduce((itemSum: number, item: any) => {
                    const costPrice = productCostMap[item.product_id?.toString()] || 0
                    return itemSum + costPrice * (item.quantity || 0)
                }, 0)
            }, 0)
            return { name: dayStr, revenue: dayRevenue, netIncome: Math.round(dayRevenue - dayCOGS - (dayRevenue * cRate)) }
        })
        return chartDays
    }, [analytics, currentPackage, completedOrders, productCostMap])

    // ── Vietnamese category labels ──────────────────────────────
    const CATEGORY_LABELS: Record<string, string> = {
        FOOD: "Thức ăn",
        TOY: "Đồ chơi",
        MEDICINE: "Thuốc & Y tế",
        ACCESSORY: "Phụ kiện",
        HYGIENE: "Vệ sinh",
        OTHER: "Khác",
        "Dịch vụ": "Dịch vụ",
    }

    // ── Category distribution ─────────────────────────────────
    const categoryData = useMemo(() => {
        const map: Record<string, number> = {}
        products?.forEach((p: any) => { map[p.category] = (map[p.category] || 0) + 1 })
        const entries = Object.entries(map).map(([name, value], i) => ({
            name: CATEGORY_LABELS[name] || name,
            value,
            color: COLORS[i % COLORS.length]
        }))
        if (!entries.length) return [{ name: "Chưa có", value: 1, color: "#E5E7EB" }]
        return entries
    }, [products])

    // ── Service performance (Hiệu quả dịch vụ) ─────────────────
    const servicePerformance = useMemo(() => {
        if (analytics?.servicePerformance?.length) return analytics.servicePerformance
        // Fallback: compute from bookings data
        if (!bookings?.length) return []
        const serviceMap: Record<string, { name: string; sales: number; revenue: number }> = {}
        bookings
            .filter((b: any) => ["COMPLETED", "DONE"].includes(b.status))
            .forEach((b: any) => {
                const serviceId = b.service_id?._id?.toString() || b.service_id?.toString()
                if (!serviceId) return
                if (!serviceMap[serviceId]) {
                    serviceMap[serviceId] = {
                        name: b.service_id?.name || "Dịch vụ",
                        sales: 0,
                        revenue: 0,
                    }
                }
                serviceMap[serviceId].sales += 1
                serviceMap[serviceId].revenue += b.service_id?.price_min || 0
            })
        return Object.values(serviceMap).sort((a, b) => b.sales - a.sales).slice(0, 6)
    }, [analytics, bookings])
    const funnelData = useMemo(() => {
        if (!orders?.length) return [
            { name: "Tổng đơn", value: 0, color: "#6B7280" },
            { name: "Chờ xử lý", value: 0, color: "#F59E0B" },
            { name: "Đã xác nhận", value: 0, color: "#3B6DB3" },
            { name: "Đang giao", value: 0, color: "#8B5CF6" },
            { name: "Hoàn thành", value: 0, color: "#10B981" },
            { name: "Đã huỷ", value: 0, color: "#EF4444" },
        ]
        const total = orders.length
        const pending = orders.filter((o: any) => o.status === "PENDING").length
        const confirmed = orders.filter((o: any) => o.status === "CONFIRMED").length
        const shipping = orders.filter((o: any) => o.status === "SHIPPING").length
        const completed = orders.filter((o: any) => ["COMPLETED", "DONE"].includes(o.status)).length
        const cancelled = orders.filter((o: any) => o.status === "CANCELLED").length
        return [
            { name: "Tổng đơn", value: total, color: "#6B7280" },
            { name: "Chờ xử lý", value: pending, color: "#F59E0B" },
            { name: "Đã xác nhận", value: confirmed, color: "#3B6DB3" },
            { name: "Đang giao", value: shipping, color: "#8B5CF6" },
            { name: "Hoàn thành", value: completed, color: "#10B981" },
            { name: "Đã huỷ", value: cancelled, color: "#EF4444" },
        ]
    }, [orders])

    const conversionRate = orders?.length
        ? Math.round((orders.filter((o: any) => ["COMPLETED", "DONE"].includes(o.status)).length / orders.length) * 100)
        : 0

    // ── Top products ──────────────────────────────────────────
    const topProducts = useMemo(() => {
        if (analytics?.topProducts?.length) return analytics.topProducts.slice(0, 5)
        // fallback from products list sorted by stock_quantity descending
        return (products ?? []).slice(0, 5).map((p: any) => ({
            name: p.name?.slice(0, 22) + (p.name?.length > 22 ? "…" : ""),
            sold: p.sold ?? 0,
            revenue: p.revenue ?? p.price,
        }))
    }, [analytics, products])

    // ── Today's tasks list ────────────────────────────────────
    const pendingList = useMemo(() => {
        const orderItems = (orders ?? [])
            .filter((o: any) => o.status === "PENDING")
            .slice(0, 3)
            .map((o: any) => ({
                id: o._id,
                type: "order",
                title: o.customer_id?.full_name || "Khách hàng",
                sub: `Đơn hàng • ${formatPrice(o.total_amount)}`,
                time: new Date(o.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
            }))
        const bookingItems = upcomingBookings
            .slice(0, 2)
            .map((b: any) => ({
                id: b._id,
                type: "booking",
                title: b.customer_id?.full_name || "Khách hàng",
                sub: `Lịch hẹn • ${b.service_id?.name || ""}`,
                time: new Date(b.booking_time).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
            }))
        return [...orderItems, ...bookingItems].slice(0, 5)
    }, [orders, upcomingBookings])

    const funnelChartData = useMemo(() => {
        return funnelData.map(d => ({
            name: d.name,
            value: d.value,
            fill: d.color
        }))
    }, [funnelData])

    // ─────────────────────────────────────────────────────────
    return (
        <div className="space-y-5 px-1 pb-6">

            {/* ── Section 1: Welcome Banner ── */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-orange-500 to-orange-400 p-6 text-white shadow-xl shadow-primary/25">
                {/* decorative circles */}
                <div className="absolute -top-8 -right-8 w-44 h-44 rounded-full bg-white/10" />
                <div className="absolute -bottom-10 -left-6 w-36 h-36 rounded-full bg-white/5" />

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner text-2xl font-black border border-white/30">
                            {user?.name?.charAt(0) ?? "M"}
                        </div>
                        <div>
                            <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">{greeting()}</p>
                            <h1 className="text-2xl font-black leading-tight">{user?.name || "Đối tác"}</h1>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {isSubActive ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white/20 rounded-full text-[11px] font-bold border border-white/30">
                                        <Crown className="w-3 h-3" />
                                        {currentPackage?.name ?? "Gói hiện tại"}
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white/20 rounded-full text-[11px] font-bold border border-white/30">
                                        <Store className="w-3 h-3" />
                                        Chưa có gói
                                    </span>
                                )}
                                {isSubActive && currentPackage?.commission_rate !== undefined && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white/15 rounded-full text-[11px] font-bold">
                                        <BarChart3 className="w-3 h-3" />
                                        Hoa hồng: {(currentPackage.commission_rate * 100).toFixed(0)}%
                                    </span>
                                )}
                                {isSubActive && activeSub?.expired_at && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white/15 rounded-full text-[11px] font-semibold">
                                        <Clock className="w-3 h-3" />
                                        {daysLeft} ngày còn lại
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                        <Button
                            variant="ghost"
                            className="bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-xl h-9 px-4 text-xs font-bold"
                            onClick={() => setActiveTab("analytics")}
                        >
                            <BarChart3 className="w-4 h-4 mr-1.5" /> Thống kê
                        </Button>
                        {!isSubActive && (
                            <Button
                                variant="ghost"
                                className="bg-white text-primary hover:bg-white/90 rounded-xl h-9 px-4 text-xs font-bold shadow-md"
                                onClick={() => setActiveTab("subscription")}
                            >
                                <Zap className="w-4 h-4 mr-1.5" /> Đăng ký gói
                            </Button>
                        )}
                    </div>
                </div>

                {/* Revenue quick stat */}
                <div className="relative mt-5 pt-4 border-t border-white/20 grid grid-cols-3 gap-4">
                    <div>
                        <p className="text-white/60 text-[10px] uppercase font-bold tracking-widest">Doanh thu tháng</p>
                        <p className="text-xl font-black mt-0.5">{analyticsLoading ? "—" : formatCompact(totalRevenue)}</p>
                    </div>
                    <div>
                        <p className="text-white/60 text-[10px] uppercase font-bold tracking-widest">Tổng đơn</p>
                        <p className="text-xl font-black mt-0.5">{totalOrders}</p>
                    </div>
                    <div>
                        <p className="text-white/60 text-[10px] uppercase font-bold tracking-widest">Tỉ lệ thành công</p>
                        <p className="text-xl font-black mt-0.5">{conversionRate}%</p>
                    </div>
                </div>
            </div>

            {/* ── Section 2: KPI Cards ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <KpiCard
                    icon={DollarSign}
                    label="Doanh thu"
                    value={analyticsLoading ? "—" : formatCompact(totalRevenue)}
                    sub={analyticsLoading ? "" : formatPrice(totalRevenue)}
                    iconBg="bg-primary/10"
                    iconColor="text-primary"
                    trend={analytics?.summary?.revenueTrend ? `${analytics.summary.revenueTrend > 0 ? '+' : ''}${analytics.summary.revenueTrend}%` : undefined}
                    trendPositive={(analytics?.summary?.revenueTrend ?? 0) >= 0}
                    onClick={() => setActiveTab("analytics")}
                />
                <KpiCard
                    icon={Coins}
                    label="Số dư TM"
                    value={`${tmBalance.toLocaleString()} TM`}
                    iconBg="bg-yellow-50"
                    iconColor="text-yellow-600"
                    onClick={() => setActiveTab("subscription")}
                />
                <KpiCard
                    icon={ShoppingCart}
                    label="Đơn chờ xử lý"
                    value={pendingOrders.toString()}
                    sub={`Tổng ${totalOrders} đơn`}
                    iconBg="bg-orange-100"
                    iconColor="text-orange-600"
                    trend={pendingOrders > 0 ? `${pendingOrders} đang chờ` : undefined}
                    trendPositive={false}
                    onClick={() => setActiveTab("orders")}
                />
                <KpiCard
                    icon={Calendar}
                    label="Lịch hẹn hôm nay"
                    value={todayBookings.length.toString()}
                    sub={`${upcomingBookings.length} đang chờ`}
                    iconBg="bg-blue-100"
                    iconColor="text-blue-600"
                    onClick={() => setActiveTab("bookings")}
                />
                <KpiCard
                    icon={Package}
                    label="Sản phẩm"
                    value={(products?.length ?? 0).toString()}
                    iconBg="bg-green-100"
                    iconColor="text-green-600"
                    onClick={() => setActiveTab("products")}
                />
            </div>

            {/* ── Section 3: Revenue Chart + Conversion Funnel ── */}
            <div className="grid lg:grid-cols-5 gap-4">
                {/* Revenue Area Chart */}
                <Card className="lg:col-span-3 border-none shadow-sm bg-white/50 backdrop-blur-md overflow-hidden">
                    <CardHeader className="py-4 pb-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-primary font-bold text-base">
                                    <TrendingUp className="w-5 h-5" /> Doanh thu 30 ngày qua
                                </CardTitle>
                                <CardDescription className="text-[10px] mt-0.5">Tổng doanh thu & thu nhập ròng</CardDescription>
                            </div>
                            <Button
                                variant="ghost" size="sm"
                                className="text-xs rounded-xl hover:bg-primary/10 hover:text-primary h-8"
                                onClick={() => setActiveTab("analytics")}
                            >
                                Chi tiết <ChevronRight className="w-3 h-3 ml-1" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="pb-4">
                        <div className="h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueChartData}>
                                    <defs>
                                        <linearGradient id="ovRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#F15A29" stopOpacity={0.25} />
                                            <stop offset="95%" stopColor="#F15A29" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="ovNet" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B6DB3" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#3B6DB3" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} tickFormatter={(v) => formatCompact(v)} width={45} />
                                    <Tooltip content={<ChartTooltip formatter={formatPrice} />} />
                                    <Area type="monotone" dataKey="revenue" name="Doanh thu" stroke="#F15A29" strokeWidth={2.5} fillOpacity={1} fill="url(#ovRevenue)" />
                                    <Area type="monotone" dataKey="netIncome" name="Thu nhập ròng" stroke="#3B6DB3" strokeWidth={2} strokeDasharray="5 3" fillOpacity={1} fill="url(#ovNet)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        {/* Legend */}
                        <div className="flex items-center gap-4 mt-2 justify-center">
                            <span className="flex items-center gap-1.5 text-[11px] text-foreground/60 font-semibold">
                                <span className="w-3 h-1 rounded bg-primary inline-block" /> Doanh thu
                            </span>
                            <span className="flex items-center gap-1.5 text-[11px] text-foreground/60 font-semibold">
                                <span className="w-3 h-1 rounded bg-blue-500 inline-block" /> Thu nhập ròng
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Order Conversion Funnel */}
                <Card className="lg:col-span-2 border-none shadow-sm bg-white/50 backdrop-blur-md overflow-hidden">
                    <CardHeader className="py-4 pb-2">
                        <CardTitle className="flex items-center gap-2 text-primary font-bold text-base">
                            <Target className="w-5 h-5" /> Tỉ lệ chuyển đổi đơn
                        </CardTitle>
                        <CardDescription className="text-[10px]">
                            Conversion rate: <span className="font-black text-green-600">{conversionRate}%</span> hoàn thành
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-4 space-y-2.5 pt-1">
                        <div className="h-[240px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={funnelChartData} layout="vertical" margin={{ left: -20, right: 30, top: 10, bottom: 10 }}>
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 11, fontWeight: 600, fill: "#6B7280" }}
                                        width={100}
                                    />
                                    <Tooltip
                                        cursor={{ fill: "transparent" }}
                                        contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                                    />
                                    <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={24}>
                                        {funnelChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── Section 4: Category Pie + Service Performance ── */}
            <div className="grid lg:grid-cols-5 gap-4">
                {/* Category Pie */}
                <Card className="lg:col-span-2 border-none shadow-sm bg-white/50 backdrop-blur-md overflow-hidden">
                    <CardHeader className="py-4 pb-0">
                        <CardTitle className="flex items-center gap-2 text-primary font-bold text-base">
                            <Layers className="w-5 h-5" /> Phân bổ ngành hàng
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4">
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%" cy="50%"
                                        innerRadius={55} outerRadius={80}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {categoryData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                                        formatter={(v: any, n: any) => [v, n]}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 mt-1">
                            {categoryData.map((cat: any) => (
                                <div key={cat.name} className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                                    <span className="text-[11px] text-foreground/70 font-semibold">{cat.name} ({cat.value})</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Service Performance Chart */}
                <Card className="lg:col-span-3 border-none shadow-sm bg-white/50 backdrop-blur-md overflow-hidden">
                    <CardHeader className="py-4 pb-2">
                        <CardTitle className="flex items-center gap-2 text-primary font-bold text-base">
                            <Zap className="w-5 h-5" /> Hiệu quả các gói dịch vụ
                        </CardTitle>
                        <CardDescription className="text-[10px]">Tỉ lệ đăng ký và doanh thu theo dịch vụ</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-4">
                        {servicePerformance.length > 0 ? (
                            <div className="h-[240px] mt-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={servicePerformance} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#6B7280", fontWeight: 700 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9CA3AF" }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                                            formatter={(value: any, name: any) => [name === "revenue" ? formatPrice(value) : value, name === "revenue" ? "Doanh thu" : "Lượt bán"]}
                                        />
                                        <Bar dataKey="sales" name="Lượt bán" radius={[6, 6, 0, 0]} barSize={28}>
                                            {servicePerformance.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-[240px] flex flex-col items-center justify-center text-foreground/30 gap-2">
                                <Activity className="w-10 h-10" />
                                <p className="text-sm font-medium">Chưa có dữ liệu dịch vụ</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ── Section 5: Subscription Status + Today Tasks ── */}
            <div className="grid lg:grid-cols-2 gap-4">
                {/* Subscription Status */}
                <Card className="border-none shadow-sm bg-white/50 backdrop-blur-md overflow-hidden">
                    <CardHeader className="py-4 pb-2">
                        <CardTitle className="flex items-center gap-2 text-primary font-bold text-base">
                            <Crown className="w-5 h-5" /> Gói Merchant
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-5 space-y-4">
                        {isSubActive && currentPackage ? (
                            <>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-black text-lg text-foreground">{currentPackage.name}</p>
                                        <p className="text-xs text-foreground/50 mt-0.5">
                                            Hết hạn: {new Date(activeSub!.expired_at!).toLocaleDateString("vi-VN")}
                                        </p>
                                    </div>
                                    <Badge className="bg-green-50 text-green-700 border-green-200 font-bold text-xs rounded-full px-3">
                                        <CheckCircle2 className="w-3 h-3 mr-1" /> Đang hoạt động
                                    </Badge>
                                </div>

                                {/* Progress bar */}
                                <div>
                                    <div className="flex justify-between text-[11px] text-foreground/50 mb-1.5 font-semibold">
                                        <span>Tiến trình gói ({subProgress}% đã dùng)</span>
                                        <span>{daysLeft} ngày còn lại</span>
                                    </div>
                                    <Progress value={subProgress} className="h-2" />
                                </div>

                                {/* Features */}
                                <div className="grid grid-cols-2 gap-2">
                                    {currentPackage.commission_rate !== undefined && (
                                        <div className="bg-primary/5 rounded-xl p-3 text-center">
                                            <p className="text-[10px] text-foreground/50 font-bold uppercase tracking-wider">Hoa hồng</p>
                                            <p className="text-xl font-black text-primary mt-0.5">{(currentPackage.commission_rate * 100).toFixed(0)}%</p>
                                        </div>
                                    )}
                                    {currentPackage.features_config?.max_products !== undefined && (
                                        <div className="bg-blue-50 rounded-xl p-3 text-center">
                                            <p className="text-[10px] text-foreground/50 font-bold uppercase tracking-wider">Sản phẩm</p>
                                            <p className="text-xl font-black text-blue-600 mt-0.5">
                                                {currentPackage.features_config.unlimited_products ? "∞" : currentPackage.features_config.max_products}
                                            </p>
                                        </div>
                                    )}
                                    {currentPackage.features_config?.qr_scanning && (
                                        <div className="bg-green-50 rounded-xl p-3 text-center">
                                            <p className="text-[10px] text-foreground/50 font-bold uppercase tracking-wider">QR Scanner</p>
                                            <p className="text-sm font-black text-green-600 mt-0.5">Đã bật</p>
                                        </div>
                                    )}
                                    {currentPackage.features_config?.ai_limit_per_day && (
                                        <div className="bg-purple-50 rounded-xl p-3 text-center">
                                            <p className="text-[10px] text-foreground/50 font-bold uppercase tracking-wider">AI/ngày</p>
                                            <p className="text-xl font-black text-purple-600 mt-0.5">{currentPackage.features_config.ai_limit_per_day}</p>
                                        </div>
                                    )}
                                </div>

                                <Button
                                    variant="outline"
                                    className="w-full rounded-xl border-primary/20 text-primary hover:bg-primary hover:text-white font-bold text-sm h-10"
                                    onClick={() => setActiveTab("subscription")}
                                >
                                    Nâng cấp gói <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </>
                        ) : (
                            <div className="text-center py-6 space-y-4">
                                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                                    <Crown className="w-8 h-8 text-primary/60" />
                                </div>
                                <div>
                                    <p className="font-bold text-foreground">Chưa đăng ký gói nào</p>
                                    <p className="text-sm text-foreground/50 mt-1">Đăng ký để mở khóa tính năng cao cấp</p>
                                </div>
                                <Button
                                    className="bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/25"
                                    onClick={() => setActiveTab("subscription")}
                                >
                                    <Zap className="w-4 h-4 mr-2" /> Đăng ký ngay
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Today's Tasks */}
                <Card className="border-none shadow-sm bg-white/50 backdrop-blur-md overflow-hidden">
                    <CardHeader className="py-4 pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-primary font-bold text-base">
                                <Activity className="w-5 h-5" /> Cần xử lý
                                {(pendingOrders + upcomingBookings.length) > 0 && (
                                    <Badge className="bg-red-100 text-red-600 border-none rounded-full text-[10px] font-black px-1.5">
                                        {pendingOrders + upcomingBookings.length}
                                    </Badge>
                                )}
                            </CardTitle>
                            <Button
                                variant="ghost" size="sm"
                                className="text-xs rounded-xl hover:bg-primary/10 hover:text-primary h-8"
                                onClick={() => setActiveTab("orders")}
                            >
                                Xem tất cả <ChevronRight className="w-3 h-3 ml-1" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="pb-4">
                        {pendingList.length > 0 ? (
                            <div className="space-y-2.5">
                                {pendingList.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center gap-3 p-3 rounded-2xl bg-white/60 border border-transparent hover:border-primary/15 hover:shadow-sm transition-all cursor-pointer group"
                                        onClick={() => setActiveTab(item.type === "order" ? "orders" : "bookings")}
                                    >
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${item.type === "order" ? "bg-orange-100" : "bg-blue-100"}`}>
                                            {item.type === "order"
                                                ? <ShoppingCart className="w-4 h-4 text-orange-600" />
                                                : <Calendar className="w-4 h-4 text-blue-600" />
                                            }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">{item.title}</p>
                                            <p className="text-[11px] text-foreground/50 truncate">{item.sub}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                                            <p className="text-[10px] text-foreground/40 font-medium">{item.time}</p>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 px-2 text-[10px] font-bold text-primary hover:bg-primary/10 rounded-lg"
                                                    onClick={(e) => {
                                                        if (item.type === "order") {
                                                            handleUpdateOrderStatus(e, item.id, "CONFIRMED")
                                                        } else {
                                                            handleUpdateBookingStatus(e, item.id, "CONFIRMED")
                                                        }
                                                    }}
                                                >
                                                    Xác nhận
                                                </Button>
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[10px] rounded-full ${item.type === "order" ? "bg-orange-50 text-orange-600 border-orange-200" : "bg-blue-50 text-blue-600 border-blue-200"}`}
                                                >
                                                    Đang chờ
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-10 flex flex-col items-center gap-2 text-foreground/30">
                                <CheckCircle2 className="w-12 h-12" />
                                <p className="text-sm font-medium">Tuyệt vời! Không có gì cần xử lý</p>
                            </div>
                        )}

                        {/* Summary bar at bottom */}
                        {pendingList.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-border/30 grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setActiveTab("orders")}
                                    className="flex items-center gap-2 p-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 transition-colors text-left"
                                >
                                    <ShoppingCart className="w-4 h-4 text-orange-600 flex-shrink-0" />
                                    <div>
                                        <p className="text-[10px] text-orange-600/70 font-bold uppercase tracking-widest">Đơn chờ</p>
                                        <p className="text-base font-black text-orange-600">{pendingOrders}</p>
                                    </div>
                                </button>
                                <button
                                    onClick={() => setActiveTab("bookings")}
                                    className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors text-left"
                                >
                                    <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                    <div>
                                        <p className="text-[10px] text-blue-600/70 font-bold uppercase tracking-widest">Lịch hẹn</p>
                                        <p className="text-base font-black text-blue-600">{upcomingBookings.length}</p>
                                    </div>
                                </button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
