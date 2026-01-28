"use client"

import { useState } from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
} from "recharts"
import {
    Download,
    TrendingUp,
    TrendingDown,
    DollarSign,
    ShoppingCart,
    Package,
    Users,
    ArrowLeft,
    ChevronRight,
    Lightbulb,
    Zap,
    Sparkles,
    CalendarDays
} from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
    formatPrice
} from "@/lib/mock-analytics-data"
import { useMerchantAnalytics } from "@/lib/hooks"
import Link from "next/link"

export function MerchantAnalytics({ onBack }: { onBack?: () => void }) {
    const [dateRange, setDateRange] = useState("30d")
    const { data: analytics, isLoading } = useMerchantAnalytics(dateRange)

    const summaryMetrics = [
        {
            label: "Tổng doanh thu",
            value: analytics?.summary?.totalRevenue || 0,
            formattedValue: formatPrice(analytics?.summary?.totalRevenue || 0),
            trend: "+12.5%",
            isPositive: true,
            icon: DollarSign,
            color: "#F97316"
        },
        {
            label: "Thu nhập ròng",
            value: analytics?.summary?.netIncome || 0,
            formattedValue: formatPrice(analytics?.summary?.netIncome || 0),
            trend: "+10.2%",
            isPositive: true,
            icon: Zap,
            color: "#0EA5E9"
        },
        {
            label: "Đơn hàng",
            value: analytics?.summary?.totalOrders || 0,
            formattedValue: (analytics?.summary?.totalOrders || 0).toLocaleString(),
            trend: "+5.1%",
            isPositive: true,
            icon: ShoppingCart,
            color: "#10B981"
        }
    ]

    const insights = [
        {
            title: "Tăng trưởng ấn tượng",
            description: "Doanh thu tuần này tăng 15.4% so với tuần trước, chủ yếu nhờ dòng thức ăn hạt.",
            icon: TrendingUp,
            color: "text-green-600",
            bg: "bg-green-50"
        },
        {
            title: "Sản phẩm chủ lực",
            description: "Dịch vụ Tắm & Spa chiếm 40% tổng số lịch hẹn trong 30 ngày qua.",
            icon: Sparkles,
            color: "text-blue-600",
            bg: "bg-blue-50"
        }
    ]

    const COLORS = ['#F97316', '#0EA5E9', '#10B981', '#8B5CF6', '#F43F5E', '#F59E0B']

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        {onBack ? (
                            <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 rounded-full">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        ) : (
                            <Link href="/dashboard/merchant">
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                            </Link>
                        )}
                        <h2 className="text-3xl font-bold tracking-tight">Phân tích hiệu quả kinh doanh</h2>
                    </div>
                    <p className="text-muted-foreground ml-10">
                        Theo dõi doanh thu, đơn hàng và hiệu suất sản phẩm của bạn.
                    </p>
                </div>
                <div className="flex items-center gap-2 ml-10 md:ml-0">
                    <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="w-[180px] rounded-xl border-primary/20">
                            <SelectValue placeholder="Chọn khoảng thời gian" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="7d">7 ngày qua</SelectItem>
                            <SelectItem value="30d">30 ngày qua</SelectItem>
                            <SelectItem value="custom">Tùy chỉnh</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button className="rounded-xl gap-2 bg-primary hover:bg-primary/90">
                        <Download className="h-4 w-4" />
                        Xuất báo cáo
                    </Button>
                </div>
            </div>

            {/* Smart Insights Banner */}
            {!isLoading && (
                <div className="grid md:grid-cols-2 gap-4">
                    {insights.map((insight, i) => (
                        <div key={i} className={`flex items-start gap-4 p-4 rounded-3xl border border-transparent ${insight.bg} transition-all hover:shadow-md cursor-default group`}>
                            <div className={`p-2 rounded-2xl bg-white shadow-sm ${insight.color}`}>
                                <insight.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-foreground">{insight.title}</h4>
                                <p className="text-xs text-foreground/60 mt-0.5 leading-relaxed">{insight.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Tabs defaultValue="finance" className="space-y-6">
                <TabsList className="bg-muted/50 p-1.5 rounded-2xl h-14 w-fit border border-muted-foreground/5">
                    <TabsTrigger value="finance" className="rounded-xl px-8 h-11 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-primary transition-all">Tài chính</TabsTrigger>
                    <TabsTrigger value="orders" className="rounded-xl px-8 h-11 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-primary transition-all">Đơn hàng</TabsTrigger>
                    <TabsTrigger value="products" className="rounded-xl px-8 h-11 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-primary transition-all">Sản phẩm</TabsTrigger>
                </TabsList>

                {/* Finance Tab */}
                <TabsContent value="finance" className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {isLoading ? (
                            Array(3).fill(0).map((_, i) => (
                                <Card key={i} className="rounded-3xl border-none shadow-sm overflow-hidden p-6 space-y-3">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-8 w-32" />
                                    <Skeleton className="h-3 w-40" />
                                </Card>
                            ))
                        ) : (
                            summaryMetrics.map((metric, index) => (
                                <Card key={index} className="rounded-3xl border-none shadow-sm bg-white/40 backdrop-blur-md overflow-hidden relative group transition-all hover:shadow-lg hover:-translate-y-1">
                                    <div className="p-6 pb-2">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="p-2.5 rounded-2xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                                                <metric.icon className="w-5 h-5" />
                                            </div>
                                            <div className={`text-xs font-bold flex items-center gap-1 ${metric.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                                {metric.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                                {metric.trend}
                                            </div>
                                        </div>
                                        <p className="text-xs font-medium text-foreground/50 uppercase tracking-widest leading-none mb-1">{metric.label}</p>
                                        <div className="text-2xl font-black text-foreground">{metric.formattedValue}</div>
                                    </div>
                                    {/* Sparkline */}
                                    <div className="h-16 w-full opacity-60 group-hover:opacity-100 transition-opacity">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={analytics?.chartData?.slice(-7) || []}>
                                                <Area
                                                    type="monotone"
                                                    dataKey={index === 0 ? "revenue" : index === 1 ? "netIncome" : "orders"}
                                                    stroke={metric.color}
                                                    strokeWidth={2}
                                                    fill={metric.color}
                                                    fillOpacity={0.1}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>

                    <Card className="rounded-3xl border-none shadow-sm bg-white/40 backdrop-blur-md">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-primary font-bold">
                                <TrendingUp className="w-5 h-5" />
                                <span className="text-lg">Biểu đồ doanh thu thực tế vs Mục tiêu</span>
                            </CardTitle>
                            <CardDescription>
                                Doanh thu hàng ngày và thu nhập ròng sau chi phí.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[400px] mt-4">
                                {isLoading ? (
                                    <div className="w-full h-full flex flex-col gap-4">
                                        <div className="flex-1 flex items-end gap-2">
                                            {Array(7).fill(0).map((_, i) => (
                                                <Skeleton key={i} className="w-full" style={{ height: `${Math.random() * 60 + 20}%` }} />
                                            ))}
                                        </div>
                                        <div className="flex justify-between">
                                            {Array(7).fill(0).map((_, i) => <Skeleton key={i} className="h-3 w-10" />)}
                                        </div>
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={analytics?.chartData || []}>
                                            <defs>
                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(value) => `${value / 1000000}M`} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                formatter={(value: number) => [formatPrice(value), ""]}
                                            />
                                            <Legend iconType="circle" />
                                            <Area type="monotone" dataKey="revenue" name="Tổng doanh thu" stroke="#F97316" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                            <Area type="monotone" dataKey="netIncome" name="Thu nhập ròng" stroke="#0EA5E9" strokeWidth={2} fillOpacity={1} fill="url(#colorNet)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Orders Tab */}
                <TabsContent value="orders" className="space-y-4">
                    <Card className="rounded-3xl border-none shadow-sm bg-white/40 backdrop-blur-md">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-primary font-bold">
                                <ShoppingCart className="w-5 h-5" />
                                <span className="text-lg">Số lượng đơn đặt hàng</span>
                            </CardTitle>
                            <CardDescription>
                                Thống kê tổng số đơn hàng và lịch hẹn theo thời gian.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[400px] mt-4">
                                {isLoading ? (
                                    <div className="w-full h-full flex flex-col gap-4">
                                        <div className="flex-1 flex items-end gap-6 px-10">
                                            {Array(7).fill(0).map((_, i) => (
                                                <Skeleton key={i} className="w-full" style={{ height: `${Math.random() * 50 + 10}%` }} />
                                            ))}
                                        </div>
                                        <div className="flex justify-between px-6">
                                            {Array(7).fill(0).map((_, i) => <Skeleton key={i} className="h-3 w-10" />)}
                                        </div>
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={analytics?.chartData || []}>
                                            <defs>
                                                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#F97316" stopOpacity={0.5} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                            <Legend iconType="circle" />
                                            <Bar dataKey="orders" name="Đơn hàng & Lịch hẹn" fill="url(#colorOrders)" radius={[10, 10, 0, 0]} barSize={40} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-none shadow-sm bg-white/40 backdrop-blur-md overflow-hidden">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-primary font-bold">
                                <Users className="w-5 h-5" />
                                <span className="text-lg">Khách hàng thân thiết (Top 5)</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow className="hover:bg-transparent border-none">
                                        <TableHead className="pl-6">Khách hàng</TableHead>
                                        <TableHead className="text-right">Tổng chi tiêu</TableHead>
                                        <TableHead className="text-right pr-6"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        Array(5).fill(0).map((_, i) => (
                                            <TableRow key={i} className="border-none">
                                                <TableCell className="pl-6"><Skeleton className="h-10 w-40" /></TableCell>
                                                <TableCell className="text-right"><Skeleton className="h-6 w-24 ml-auto" /></TableCell>
                                                <TableCell className="pr-6"></TableCell>
                                            </TableRow>
                                        ))
                                    ) : analytics?.topCustomers?.length > 0 ? (
                                        analytics.topCustomers.map((customer: any) => (
                                            <TableRow key={customer.id} className="hover:bg-muted/20 border-none transition-colors cursor-pointer group">
                                                <TableCell className="font-medium pl-6">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-10 w-10 border-2 border-primary/10 shadow-sm transition-transform group-hover:scale-110">
                                                            <AvatarImage src={customer.avatar} alt={customer.name} />
                                                            <AvatarFallback className="bg-primary/5 text-primary text-xs">{customer.name.substring(0, 2)}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="group-hover:text-primary transition-colors">{customer.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-primary">
                                                    {formatPrice(customer.totalSpent)}
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <Button variant="ghost" size="icon" className="group-hover:translate-x-1 transition-transform h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary">
                                                        <ChevronRight className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-10 text-muted-foreground italic">Chưa có đủ dữ liệu khách hàng</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Products Tab */}
                <TabsContent value="products" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-7">
                        <Card className="md:col-span-3 rounded-3xl border-none shadow-sm bg-white/40 backdrop-blur-md">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-primary font-bold">
                                    <Package className="w-5 h-5" />
                                    <span className="text-lg text-foreground">Cơ cấu doanh thu</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    {isLoading ? (
                                        <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                                            <Skeleton className="h-40 w-40 rounded-full" />
                                            <div className="flex gap-2">
                                                <Skeleton className="h-3 w-16" />
                                                <Skeleton className="h-3 w-16" />
                                            </div>
                                        </div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={analytics?.categories || []}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={70}
                                                    outerRadius={100}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {(analytics?.categories || []).map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                                <Legend layout="horizontal" align="center" verticalAlign="bottom" iconType="circle" />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="md:col-span-4 rounded-3xl border-none shadow-sm bg-white/40 backdrop-blur-md overflow-hidden">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-primary font-bold">
                                    <TrendingUp className="w-5 h-5" />
                                    <span className="text-lg text-foreground">Top 5 sản phẩm bán chạy</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader className="bg-muted/30">
                                        <TableRow className="hover:bg-transparent border-none">
                                            <TableHead className="pl-6 uppercase text-[10px] font-bold tracking-wider opacity-60">Sản phẩm</TableHead>
                                            <TableHead className="text-center uppercase text-[10px] font-bold tracking-wider opacity-60">Đã bán</TableHead>
                                            <TableHead className="text-right pr-6 uppercase text-[10px] font-bold tracking-wider opacity-60">Doanh thu</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            Array(5).fill(0).map((_, i) => (
                                                <TableRow key={i} className="border-none">
                                                    <TableCell className="pl-6"><Skeleton className="h-4 w-40" /></TableCell>
                                                    <TableCell className="text-center"><Skeleton className="h-4 w-10 mx-auto" /></TableCell>
                                                    <TableCell className="pr-6 text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                                                </TableRow>
                                            ))
                                        ) : analytics?.topProducts?.length > 0 ? (
                                            analytics.topProducts.map((product: any) => (
                                                <TableRow key={product.id} className="hover:bg-primary/5 border-none transition-colors group">
                                                    <TableCell className="pl-6 font-semibold group-hover:text-primary transition-colors max-w-[200px] truncate">{product.name}</TableCell>
                                                    <TableCell className="text-center font-bold text-foreground/70">{product.sold}</TableCell>
                                                    <TableCell className="text-right pr-6 font-black text-primary">{formatPrice(product.revenue)}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-10 text-muted-foreground italic">Chưa có dữ liệu sản phẩm</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="rounded-3xl border-none shadow-sm bg-white/40 backdrop-blur-md overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-red-500 font-bold flex items-center gap-2">
                                <Package className="w-5 h-5" />
                                <span className="text-lg">Sản phẩm bán chậm</span>
                            </CardTitle>
                            <CardDescription>
                                Những sản phẩm chưa có lượt bán trong 30-60 ngày gần đây.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-red-50/20">
                                    <TableRow className="hover:bg-transparent border-none">
                                        <TableHead className="pl-6 uppercase text-[10px] font-bold tracking-wider opacity-60">Tên sản phẩm</TableHead>
                                        <TableHead className="text-center uppercase text-[10px] font-bold tracking-wider opacity-60">Tồn kho</TableHead>
                                        <TableHead className="text-right pr-6 uppercase text-[10px] font-bold tracking-wider opacity-60">Lần cuối bán</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        Array(3).fill(0).map((_, i) => (
                                            <TableRow key={i} className="border-none">
                                                <TableCell className="pl-6"><Skeleton className="h-4 w-48" /></TableCell>
                                                <TableCell className="text-center"><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                                                <TableCell className="pr-6 text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : analytics?.slowProducts?.length > 0 ? (
                                        analytics.slowProducts.map((product: any) => (
                                            <TableRow key={product.id} className="hover:bg-red-50/40 border-none transition-colors group">
                                                <TableCell className="pl-6 font-medium group-hover:text-red-600 transition-colors">{product.name}</TableCell>
                                                <TableCell className="text-center font-bold text-foreground/70">{product.stock}</TableCell>
                                                <TableCell className="text-right pr-6 text-muted-foreground font-medium">{product.lastSold}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-10 text-muted-foreground italic">Mọi sản phẩm đều đang vận hành tốt</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
