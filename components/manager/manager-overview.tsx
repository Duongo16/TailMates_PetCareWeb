"use client"

import React, { useMemo } from "react"
import {
    useManagerStats,
    useManagerMerchants,
    usePackages,
} from "@/lib/hooks"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { managerAPI } from "@/lib/api"
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
    Users,
    Store,
    ShoppingCart,
    TrendingUp,
    TrendingDown,
    Crown,
    Activity,
    Target,
    Layers,
    ArrowUpRight,
    ArrowRight,
    Search,
    Clock,
    CheckCircle2,
    Briefcase,
    ShieldCheck,
    Zap,
    BarChart3,
    ChevronRight,
} from "lucide-react"

interface ManagerOverviewProps {
    setActiveTab: (tab: any) => void
}

const COLORS = ["#F15A29", "#3B6DB3", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444", "#EC4899"]

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

export function ManagerOverview({ setActiveTab }: ManagerOverviewProps) {
    const { user } = useAuth()
    const { data: statsData, isLoading: statsLoading } = useManagerStats()
    const { data: merchantsData } = useManagerMerchants({ status: "all" })
    const { data: packagesData } = usePackages()
    const { toast } = useToast()

    // ── Pre-calculations ──────────────────────────────────────
    const totalOrderRevenue = statsData?.orders?.total_revenue || 0
    const totalPackageRevenue = statsData?.packages?.total_revenue || 0
    const totalRevenue = statsData?.total_platform_revenue || (totalOrderRevenue + totalPackageRevenue)

    const totalOrders = statsData?.orders?.order_count || 0
    const totalSubscriptions = statsData?.packages?.subscription_count || 0

    const totalCustomers = statsData?.users?.customer || 0
    const totalMerchants = statsData?.users?.merchant || 0
    const dailyRevenue = statsData?.daily_revenue || []

    const pendingMerchants = merchantsData?.merchants?.filter((m: any) => !m.is_active).length || 0

    const greeting = () => {
        const h = new Date().getHours()
        if (h < 12) return "Chào buổi sáng"
        if (h < 18) return "Chào buổi chiều"
        return "Chào buổi tối"
    }

    // ── Chart Data ────────────────────────────────────────────
    const revenueTrendData = useMemo(() => {
        if (!dailyRevenue.length) {
            return Array.from({ length: 7 }, (_, i) => {
                const d = new Date(); d.setDate(d.getDate() - (6 - i))
                return {
                    name: d.toLocaleDateString("vi-VN", { day: "numeric", month: "numeric" }),
                    revenue: 0,
                    order_revenue: 0,
                    package_revenue: 0
                }
            })
        }
        return dailyRevenue.map((item: any) => ({
            name: item.date.slice(5), // YYYY-MM-DD -> MM-DD
            revenue: item.total_revenue,
            order_revenue: item.order_revenue,
            package_revenue: item.package_revenue
        }))
    }, [dailyRevenue])

    const subscriptionDistribution = useMemo(() => {
        const total = totalOrderRevenue + totalPackageRevenue
        if (total === 0) return [
            { name: "Đơn hàng", value: 50, color: COLORS[0] },
            { name: "Gói đăng ký", value: 50, color: COLORS[1] },
        ]

        return [
            {
                name: "Đơn hàng",
                value: Math.round((totalOrderRevenue / total) * 100),
                color: COLORS[1],
                amount: totalOrderRevenue
            },
            {
                name: "Gói đăng ký",
                value: Math.round((totalPackageRevenue / total) * 100),
                color: COLORS[0],
                amount: totalPackageRevenue
            },
        ]
    }, [totalOrderRevenue, totalPackageRevenue])

    const packagePerformanceData = useMemo(() => {
        if (!packagesData || !statsData?.packages?.performance) return []

        const performanceMap = new Map()
        statsData.packages.performance.forEach((p: any) => {
            performanceMap.set(p._id.toString(), p)
        })

        return (packagesData || []).map((pkg: any, i: number) => {
            const perf = performanceMap.get(pkg._id.toString())
            return {
                name: pkg.name.slice(0, 10),
                sales: perf?.sales || 0,
                revenue: perf?.revenue || 0,
                fill: COLORS[i % COLORS.length]
            }
        }).sort((a, b) => b.sales - a.sales).slice(0, 6)
    }, [packagesData, statsData])

    // ── Leaderboard ───────────────────────────────────────────
    const topMerchants = useMemo(() => {
        return statsData?.top_merchants || []
    }, [statsData])

    // ─────────────────────────────────────────────────────────
    return (
        <div className="space-y-5 px-1 pb-6">

            {/* ── Section 1: Welcome Banner ── */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-400 p-6 text-white shadow-xl shadow-blue-500/20">
                <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10" />
                <div className="absolute -bottom-12 -left-8 w-40 h-40 rounded-full bg-white/5" />

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner text-2xl font-black border border-white/30">
                            {user?.name?.charAt(0) ?? "M"}
                        </div>
                        <div>
                            <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">{greeting()}</p>
                            <h1 className="text-2xl font-black leading-tight">{user?.name || "Manager"}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/30 rounded-full text-[10px] font-bold px-2.5">
                                    <ShieldCheck className="w-3 h-3 mr-1" /> Quản trị viên
                                </Badge>
                                <span className="text-white/60 text-[11px] font-medium">Platform Health: <span className="text-green-300 font-black">Excellent</span></span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                        <Button
                            variant="ghost"
                            className="bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-xl h-9 px-4 text-xs font-bold"
                            onClick={() => setActiveTab("revenue")}
                        >
                            <BarChart3 className="w-4 h-4 mr-1.5" /> Báo cáo tài chính
                        </Button>
                        {pendingMerchants > 0 && (
                            <Button
                                className="bg-white text-blue-600 hover:bg-white/90 rounded-xl h-9 px-4 text-xs font-bold shadow-md animate-pulse"
                                onClick={() => setActiveTab("merchants")}
                            >
                                <Zap className="w-4 h-4 mr-1.5" /> {pendingMerchants} Merchant chờ duyệt
                            </Button>
                        )}
                    </div>
                </div>

                {/* Platform Summary Stats */}
                <div className="relative mt-6 pt-5 border-t border-white/20 grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                        <p className="text-white/60 text-[10px] uppercase font-bold tracking-widest">Tổng doanh thu</p>
                        <p className="text-2xl font-black mt-0.5">{statsLoading ? "—" : formatCompact(totalRevenue)}</p>
                        <p className="text-[10px] text-green-300 font-bold flex items-center gap-0.5 mt-0.5">
                            <TrendingUp className="w-3 h-3" /> +12.4% so với tháng trước
                        </p>
                    </div>
                    <div>
                        <p className="text-white/60 text-[10px] uppercase font-bold tracking-widest">Tổng người dùng</p>
                        <p className="text-2xl font-black mt-0.5">{totalCustomers.toLocaleString()}</p>
                        <p className="text-[10px] text-white/50 font-bold mt-0.5">+{Math.round(totalCustomers * 0.05)} mới trong tuần</p>
                    </div>
                    <div>
                        <p className="text-white/60 text-[10px] uppercase font-bold tracking-widest">Đối tác Merchant</p>
                        <p className="text-2xl font-black mt-0.5">{totalMerchants}</p>
                        <p className="text-[10px] text-yellow-300 font-bold mt-0.5">{pendingMerchants} đang đợi xét duyệt</p>
                    </div>
                    <div>
                        <p className="text-white/60 text-[10px] uppercase font-bold tracking-widest">Đơn hàng hoàn tất</p>
                        <p className="text-2xl font-black mt-0.5">{totalOrders.toLocaleString()}</p>
                        <p className="text-[10px] text-white/50 font-bold mt-0.5">Avg: {(totalOrders / 30).toFixed(0)} đơn/ngày</p>
                    </div>
                </div>
            </div>

            {/* ── Section 2: KPI Detail Cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <KpiCard
                    icon={DollarSign}
                    label="Doanh thu Order"
                    value={formatCompact(totalOrderRevenue)}
                    sub={`${totalOrders} đơn hàng`}
                    iconBg="bg-blue-50"
                    iconColor="text-blue-600"
                    trend="+12%"
                    trendPositive={true}
                    onClick={() => setActiveTab("revenue")}
                />
                <KpiCard
                    icon={Crown}
                    label="Doanh thu Gói"
                    value={formatCompact(totalPackageRevenue)}
                    sub={`${totalSubscriptions} lượt đăng ký`}
                    iconBg="bg-purple-50"
                    iconColor="text-purple-600"
                    trend="+8.5%"
                    trendPositive={true}
                    onClick={() => setActiveTab("packages")}
                />
                <KpiCard
                    icon={Users}
                    label="Khách hàng"
                    value={totalCustomers.toLocaleString()}
                    iconBg="bg-orange-50"
                    iconColor="text-orange-600"
                    onClick={() => setActiveTab("revenue")}
                />
                <KpiCard
                    icon={Store}
                    label="Merchants"
                    value={totalMerchants.toString()}
                    sub={`${pendingMerchants} chờ duyệt`}
                    iconBg="bg-green-50"
                    iconColor="text-green-600"
                    onClick={() => setActiveTab("merchants")}
                />
                <KpiCard
                    icon={ShoppingCart}
                    label="Đơn hàng"
                    value={totalOrders.toLocaleString()}
                    iconBg="bg-indigo-50"
                    iconColor="text-indigo-600"
                    onClick={() => setActiveTab("revenue")}
                />
            </div>

            {/* ── Section 3: Revenue Trend & Subscription Analysis ── */}
            <div className="grid lg:grid-cols-5 gap-4">
                {/* Revenue Chart */}
                <Card className="lg:col-span-3 border-none shadow-sm bg-white/50 backdrop-blur-md overflow-hidden">
                    <CardHeader className="py-4 pb-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-blue-600 font-bold text-base">
                                    <Activity className="w-5 h-5" /> Xu hướng doanh thu tổng hợp (30 ngày)
                                </CardTitle>
                                <CardDescription className="text-[10px] mt-0.5">Bao gồm doanh thu từ Order và Gói đăng ký</CardDescription>
                            </div>
                            <Button
                                variant="ghost" size="sm"
                                className="text-xs rounded-xl hover:bg-blue-50 hover:text-blue-600 h-8 font-bold"
                                onClick={() => setActiveTab("revenue")}
                            >
                                Chi tiết <ChevronRight className="w-3 h-3 ml-1" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="pb-4">
                        <div className="h-[250px] w-full mt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueTrendData}>
                                    <defs>
                                        <linearGradient id="managerRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B6DB3" stopOpacity={0.25} />
                                            <stop offset="95%" stopColor="#3B6DB3" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="packageRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#F15A29" stopOpacity={0.25} />
                                            <stop offset="95%" stopColor="#F15A29" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} tickFormatter={(v) => formatCompact(v)} width={40} />
                                    <Tooltip content={<ChartTooltip formatter={formatPrice} />} />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: "10px", fontWeight: "bold", paddingTop: "10px" }} />
                                    <Area type="monotone" dataKey="order_revenue" name="Doanh thu Order" stroke="#3B6DB3" strokeWidth={3} fillOpacity={1} fill="url(#managerRev)" />
                                    <Area type="monotone" dataKey="package_revenue" name="Doanh thu Gói" stroke="#F15A29" strokeWidth={3} fillOpacity={1} fill="url(#packageRev)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Subscription Distribution */}
                <Card className="lg:col-span-2 border-none shadow-sm bg-white/50 backdrop-blur-md overflow-hidden">
                    <CardHeader className="py-4 pb-0 text-center lg:text-left">
                        <CardTitle className="flex items-center gap-2 text-blue-600 font-bold text-base justify-center lg:justify-start">
                            <Layers className="w-5 h-5" /> Cơ cấu doanh thu nền tảng
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4">
                        <div className="h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={subscriptionDistribution}
                                        cx="50%" cy="50%"
                                        innerRadius={60} outerRadius={85}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {subscriptionDistribution.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
                                        formatter={(value: any, name: any, props: any) => [formatPrice(props.payload.amount), name]}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-2 gap-y-2 mt-2">
                            {subscriptionDistribution.map((item) => (
                                <div key={item.name} className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                                    <span className="text-[11px] font-bold text-foreground/70 truncate">{item.name}</span>
                                    <span className="text-[11px] font-black">{item.value}%</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── Section 4: Package Performance & Top Partners ── */}
            <div className="grid lg:grid-cols-5 gap-4">
                {/* Package Performance */}
                <Card className="lg:col-span-3 border-none shadow-sm bg-white/50 backdrop-blur-md overflow-hidden">
                    <CardHeader className="py-4 pb-2">
                        <CardTitle className="flex items-center gap-2 text-blue-600 font-bold text-base">
                            <Zap className="w-5 h-5" /> Hiệu quả các gói dịch vụ
                        </CardTitle>
                        <CardDescription className="text-[10px]">Tỉ lệ đăng ký và doanh thu theo gói</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-4">
                        <div className="h-[240px] mt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={packagePerformanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#6B7280", fontWeight: 700 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9CA3AF" }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                                        formatter={(value: any, name: any) => [name === "revenue" ? formatPrice(value) : value, name === "revenue" ? "Doanh thu" : "Lượt bán"]}
                                    />
                                    <Bar dataKey="sales" name="Lượt bán" radius={[6, 6, 0, 0]} barSize={28}>
                                        {packagePerformanceData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} fillOpacity={0.8} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Top Merchants Leaderboard */}
                <Card className="lg:col-span-2 border-none shadow-sm bg-white/50 backdrop-blur-md overflow-hidden">
                    <CardHeader className="py-4 pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-blue-600 font-bold text-base">
                                <Target className="w-5 h-5" /> Top đối tác Merchant
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pb-4 pt-1">
                        <div className="space-y-3">
                            {topMerchants.slice(0, 5).map((m: any, i: number) => (
                                <div key={m._id} className="flex items-center gap-3 p-2.5 bg-white/60 rounded-2xl group hover:bg-blue-50/50 transition-colors">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${i === 0 ? "bg-yellow-100 text-yellow-700" :
                                        i === 1 ? "bg-gray-100 text-gray-700" :
                                            i === 2 ? "bg-orange-100 text-orange-700" : "bg-white text-foreground/40"
                                        }`}>
                                        {i + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-black truncate group-hover:text-blue-600 transition-colors">
                                            {m.merchant_profile?.shop_name || m.full_name}
                                        </p>
                                        <p className="text-[10px] text-foreground/40 font-bold">Thành viên từ: {new Date(m.created_at).getFullYear()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-blue-600">Premium</p>
                                        <p className="text-[10px] text-foreground/40 font-bold">8.5% Comm.</p>
                                    </div>
                                </div>
                            ))}
                            {!topMerchants.length && (
                                <div className="h-[200px] flex flex-col items-center justify-center opacity-30">
                                    <Store className="w-10 h-10 mb-2" />
                                    <p className="text-sm font-bold">Chưa có dữ liệu</p>
                                </div>
                            )}
                        </div>
                        <Button
                            variant="outline"
                            className="w-full mt-4 rounded-xl border-blue-100 text-blue-600 hover:bg-blue-50 font-bold text-xs h-9"
                            onClick={() => setActiveTab("merchants")}
                        >
                            Xem tất cả đối tác <ChevronRight className="w-3 h-3 ml-1" />
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* ── Section 5: Recent Alerts & System Checks ── */}
            <div className="grid lg:grid-cols-2 gap-4">
                {/* Approvals / Notifications */}
                <Card className="border-none shadow-sm bg-white/50 backdrop-blur-md overflow-hidden">
                    <CardHeader className="py-4 pb-2">
                        <CardTitle className="flex items-center gap-2 text-blue-600 font-bold text-base">
                            <Clock className="w-5 h-5" /> Yêu cầu chờ xử lý
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4 space-y-3">
                        {pendingMerchants > 0 ? (
                            <div
                                className="flex items-center gap-4 p-4 rounded-2xl bg-orange-50 border border-orange-100 cursor-pointer hover:shadow-md transition-all group"
                                onClick={() => setActiveTab("merchants")}
                            >
                                <div className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                                    <Store className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-black text-orange-700">Xác thực Merchant</p>
                                    <p className="text-xs text-orange-600/70 font-bold">{pendingMerchants} đối tác mới đang chờ được bạn kích hoạt</p>
                                </div>
                                <ArrowUpRight className="w-5 h-5 text-orange-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </div>
                        ) : (
                            <div className="p-8 text-center bg-green-50/50 rounded-2xl border border-dashed border-green-200">
                                <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-2" />
                                <p className="text-sm font-bold text-green-700">Tất cả đã được xử lý</p>
                                <p className="text-xs text-green-600/60 mt-1">Không có yêu cầu chờ duyệt hiện tại</p>
                            </div>
                        )}

                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-blue-50 border border-blue-100 cursor-pointer hover:shadow-md transition-all group">
                            <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                                <Layers className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-black text-blue-700">Duyệt bài viết Blog</p>
                                <p className="text-xs text-blue-600/70 font-bold">2 bài viết mới từ cộng đồng cần kiểm duyệt nội dung</p>
                            </div>
                            <Button
                                variant="ghost" size="icon"
                                className="rounded-full hover:bg-blue-200/50 text-blue-400"
                            >
                                <ArrowRight className="w-5 h-5" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* System Activity */}
                <Card className="border-none shadow-sm bg-white/50 backdrop-blur-md overflow-hidden">
                    <CardHeader className="py-4 pb-2 text-center lg:text-left">
                        <CardTitle className="flex items-center gap-2 text-blue-600 font-bold text-base justify-center lg:justify-start">
                            <Activity className="w-5 h-5" /> Hoạt động hệ thống gần đây
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4 pt-1">
                        <div className="space-y-4">
                            {[
                                { user: "Nguyễn Văn A", action: "Đã nâng cấp lên gói Premium", time: "5 phút trước", icon: Crown, color: "text-purple-500", bg: "bg-purple-50" },
                                { user: "Paws & Claws Shop", action: "Đã đăng ký tài khoản Merchant", time: "12 phút trước", icon: Store, color: "text-blue-500", bg: "bg-blue-50" },
                                { user: "Trần Thị B", action: "Vừa đổi TM lấy Voucher", time: "25 phút trước", icon: Zap, color: "text-yellow-500", bg: "bg-yellow-50" },
                                { user: "System", action: "Đã tự động gia hạn 12 subscriptions", time: "1 giờ trước", icon: ShieldCheck, color: "text-green-500", bg: "bg-green-50" },
                            ].map((activity, i) => (
                                <div key={i} className="flex items-start gap-3 relative">
                                    {i !== 3 && <div className="absolute left-4 top-8 bottom-[-16px] w-[1px] bg-slate-200" />}
                                    <div className={`w-8 h-8 rounded-full ${activity.bg} flex items-center justify-center flex-shrink-0 z-10`}>
                                        <activity.icon className={`w-4 h-4 ${activity.color}`} />
                                    </div>
                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <p className="text-xs font-bold leading-none">
                                            <span className="text-blue-600">{activity.user}</span> {activity.action}
                                        </p>
                                        <p className="text-[10px] text-foreground/40 mt-1 font-medium">{activity.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
