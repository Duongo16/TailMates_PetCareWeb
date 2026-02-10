"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider
} from "@/components/ui/tooltip"
import {
    Sparkles,
    ShoppingCart,
    Calendar,
    AlertTriangle,
    TrendingUp,
    Heart,
    Bone,
    Dumbbell,
    Pill,
    Stethoscope,
    Zap,
    Scissors,
    ChevronRight,
    Star,
    Clock,
    Shield,
    Flame,
    Leaf,
    Activity,
    Check,
    X
} from "lucide-react"
import { AISuggestionResponse, PetHealthIndex, FoodRecommendation, ServiceRecommendation } from "@/lib/types/ai-suggestions"
import { aiAPI } from "@/lib/api"

interface AISuggestionsProps {
    petId: string
    petName: string
}

const iconMap: Record<string, React.ReactNode> = {
    protein: <Dumbbell className="w-4 h-4" />,
    heart: <Heart className="w-4 h-4" />,
    bone: <Bone className="w-4 h-4" />,
    stomach: <Pill className="w-4 h-4" />,
    vitamin: <Pill className="w-4 h-4" />,
    checkup: <Stethoscope className="w-4 h-4" />,
    energy: <Zap className="w-4 h-4" />,
    fur: <Scissors className="w-4 h-4" />,
}

const iconColorMap: Record<string, string> = {
    protein: "text-orange-500 bg-orange-100",
    heart: "text-red-500 bg-red-100",
    bone: "text-amber-600 bg-amber-100",
    stomach: "text-green-500 bg-green-100",
    vitamin: "text-purple-500 bg-purple-100",
    checkup: "text-blue-500 bg-blue-100",
    energy: "text-yellow-500 bg-yellow-100",
    fur: "text-pink-500 bg-pink-100",
}

// Cute loading messages
const loadingMessages = [
    { emoji: "🐕", text: "Đang phân tích hồ sơ sức khỏe..." },
    { emoji: "🔬", text: "AI đang đọc dữ liệu dinh dưỡng..." },
    { emoji: "🍖", text: "Tìm kiếm thức ăn phù hợp nhất..." },
    { emoji: "💊", text: "Kiểm tra lịch tiêm phòng..." },
    { emoji: "📊", text: "Tính toán chỉ số sức khỏe..." },
    { emoji: "✨", text: "Hoàn tất phân tích AI..." },
]

export function AISuggestions({ petId, petName }: AISuggestionsProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<AISuggestionResponse | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [loadingStep, setLoadingStep] = useState(0)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    // Caching states
    const [isCached, setIsCached] = useState(false)
    const [isOutdated, setIsOutdated] = useState(false)
    const [daysSince, setDaysSince] = useState<number | undefined>()

    // Animate loading messages
    useEffect(() => {
        if (!loading) return
        const interval = setInterval(() => {
            setLoadingStep(prev => (prev + 1) % loadingMessages.length)
        }, 1500)
        return () => clearInterval(interval)
    }, [loading])

    // Load cached analysis on mount
    useEffect(() => {
        fetchCachedAnalysis()
    }, [petId])

    const fetchCachedAnalysis = async () => {
        try {
            const result = await aiAPI.getCachedHealthAnalysis(petId)
            if (result.success && result.data?.analysis) {
                // Transform cached data to match AISuggestionResponse format
                setData({
                    pet_id: petId,
                    pet_name: petName,
                    analysis: result.data.analysis,
                    food_recommendations: result.data.analysis.food_recommendations || [],
                    service_recommendations: result.data.analysis.service_recommendations || [],
                    generated_at: result.data.analysis.analyzed_at
                })
                setIsCached(result.data.is_cached)
                setIsOutdated(result.data.is_outdated)
                setDaysSince(result.data.days_since_analysis)
            }
        } catch (err) {
            console.error("Failed to fetch cached health analysis:", err)
        }
    }

    const fetchSuggestions = async () => {
        setLoading(true)
        setError(null)
        setLoadingStep(0)

        try {
            const result = await aiAPI.suggestions(petId)
            if (result.success && result.data) {
                setData(result.data as AISuggestionResponse)
                // Reset cache state on new analysis
                setIsCached(false)
                setIsOutdated(false)
                setDaysSince(0)
            } else {
                setError(result.message || "Không thể tải gợi ý. Vui lòng thử lại.")
            }
        } catch (err) {
            console.error("Failed to fetch suggestions:", err)
            setError("Không thể tải gợi ý. Vui lòng thử lại.")
        } finally {
            setLoading(false)
        }
    }

    const getUrgencyStyle = (urgency: string) => {
        switch (urgency) {
            case "CRITICAL": return { bg: "bg-red-500", text: "text-white", border: "border-red-500", label: "Khẩn cấp" }
            case "HIGH": return { bg: "bg-orange-500", text: "text-white", border: "border-orange-500", label: "Cao" }
            case "MEDIUM": return { bg: "bg-yellow-500", text: "text-black", border: "border-yellow-500", label: "Trung bình" }
            default: return { bg: "bg-green-500", text: "text-white", border: "border-green-500", label: "Thấp" }
        }
    }

    const handleBuyProduct = (productId: string) => {
        router.push(`/products/${productId}`)
    }

    const handleBookService = (serviceId: string) => {
        router.push(`/dashboard/customer?tab=booking&serviceId=${serviceId}`)
    }

    // Calculate average health score
    const avgHealthScore = data?.analysis?.health_indices?.length
        ? Math.round(data.analysis.health_indices.reduce((sum, idx) => sum + (idx?.value || 0), 0) / data.analysis.health_indices.length)
        : 0

    return (
        <TooltipProvider>
            <div className="space-y-4">
                {/* Compact Header with Analyze Button */}
                {!data && !loading && (
                    <Card className="relative overflow-hidden border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 dark:from-primary/10 dark:via-accent/10 dark:to-primary/10">
                        <CardContent className="p-6 text-center">
                            <div className="mb-4">
                                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-3 animate-pulse">
                                    <Sparkles className="w-10 h-10 text-white" />
                                </div>
                                <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                    Phân tích AI cho {petName}
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Nhận gợi ý thức ăn và dịch vụ phù hợp nhất dựa trên dữ liệu sức khỏe
                                </p>
                            </div>
                            <Button
                                onClick={fetchSuggestions}
                                size="lg"
                                className="bg-gradient-to-r from-primary via-primary/90 to-accent text-white hover:opacity-90 shadow-lg hover:shadow-xl transition-all"
                            >
                                <Sparkles className="w-5 h-5 mr-2" />
                                Bắt đầu phân tích
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Cute Loading Animation */}
                {loading && (
                    <Card className="relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 animate-gradient-x" />
                        <CardContent className="p-8 text-center relative">
                            {/* Animated Pet */}
                            <div className="relative w-32 h-32 mx-auto mb-6">
                                {/* Outer ring */}
                                <div className="absolute inset-0 rounded-full border-4 border-purple-200 dark:border-purple-800" />
                                {/* Spinning ring */}
                                <svg className="absolute inset-0 w-32 h-32 animate-spin-slow" viewBox="0 0 128 128">
                                    <circle
                                        cx="64" cy="64" r="60"
                                        fill="none"
                                        stroke="url(#gradient)"
                                        strokeWidth="4"
                                        strokeDasharray="100 280"
                                        strokeLinecap="round"
                                    />
                                    <defs>
                                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#f15a29" />
                                            <stop offset="100%" stopColor="#3b6db3" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                {/* Center emoji */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-5xl animate-bounce-slow">
                                        {loadingMessages[loadingStep].emoji}
                                    </span>
                                </div>
                            </div>

                            {/* Loading text */}
                            <div className="h-8">
                                <p className="text-lg font-medium text-foreground animate-fade-in">
                                    {loadingMessages[loadingStep].text}
                                </p>
                            </div>

                            {/* Progress dots */}
                            <div className="flex justify-center gap-2 mt-4">
                                {loadingMessages.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === loadingStep
                                            ? "w-6 bg-gradient-to-r from-primary to-accent"
                                            : idx < loadingStep
                                                ? "bg-primary/30"
                                                : "bg-gray-200 dark:bg-gray-700"
                                            }`}
                                    />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Error State */}
                {error && (
                    <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <X className="w-5 h-5 text-red-500" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-red-700 dark:text-red-400">{error}</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={fetchSuggestions}>
                                Thử lại
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Fallback Notice */}
                {data?.is_fallback && (
                    <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
                        <CardContent className="p-3 flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-sm">Đang sử dụng gợi ý cơ bản. {data.fallback_reason}</span>
                        </CardContent>
                    </Card>
                )}

                {/* Outdated Analysis Warning Banner */}
                {data && isOutdated && (
                    <Card className="border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20">
                        <CardContent className="p-3 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                                <Clock className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-yellow-700 dark:text-yellow-400">
                                    ⚠️ Phân tích đã được thực hiện cách đây {daysSince} ngày
                                </p>
                                <p className="text-sm text-yellow-600 dark:text-yellow-500">
                                    Bạn nên cập nhật để có thông tin chính xác hơn về sức khỏe của {petName}!
                                </p>
                            </div>
                            <Button size="sm" onClick={fetchSuggestions} className="flex-shrink-0">
                                <Sparkles className="w-4 h-4 mr-1" />
                                Cập nhật
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Cached Analysis Header */}
                {data && isCached && !isOutdated && (
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Badge variant="outline" className="border-primary/30">
                                <Activity className="w-3 h-3 mr-1" />
                                Cached
                            </Badge>
                            <span>
                                Phân tích {daysSince === 0 ? "hôm nay" : `${daysSince} ngày trước`}
                            </span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={fetchSuggestions}>
                            <Sparkles className="w-4 h-4 mr-1" />
                            Phân tích lại
                        </Button>
                    </div>
                )}

                {/* Main Results */}
                {isMounted && data && (
                    <>
                        {/* Health Summary + Score Overview */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {/* Left: Health Score Radial */}
                            <Card className="lg:col-span-1">
                                <CardContent className="p-4 flex flex-col items-center">
                                    <RadialScoreChart score={avgHealthScore} size={140} />
                                    <h4 className="font-bold text-lg mt-2">Điểm sức khỏe</h4>
                                    <p className="text-xs text-muted-foreground text-center">
                                        Trung bình từ {(data?.analysis?.health_indices || []).length} chỉ số
                                    </p>

                                    {/* Quick Stats Pills */}
                                    <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                                        <Badge variant="outline" className="text-xs">
                                            {data.analysis.weight_status === "NORMAL" ? "✓ Cân nặng chuẩn" :
                                                data.analysis.weight_status === "UNDERWEIGHT" ? "↓ Thiếu cân" : "↑ Thừa cân"}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs">
                                            {data.analysis.activity_level === "HIGH" ? "⚡ Năng động" :
                                                data.analysis.activity_level === "MODERATE" ? "🚶 Trung bình" : "😴 Ít vận động"}
                                        </Badge>
                                    </div>

                                    {/* Special Diet */}
                                    {data.analysis.nutritional_needs.specialDiet && (
                                        <Badge className="mt-2 bg-primary/10 text-primary hover:bg-primary/20">
                                            <Leaf className="w-3 h-3 mr-1" />
                                            {data.analysis.nutritional_needs.specialDiet}
                                        </Badge>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Right: Health Summary + Indices */}
                            <Card className="lg:col-span-2">
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <TrendingUp className="w-4 h-4 text-green-500" />
                                        Tổng quan sức khỏe
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="ml-auto"
                                            onClick={fetchSuggestions}
                                        >
                                            <Sparkles className="w-4 h-4 mr-1" />
                                            Phân tích lại
                                        </Button>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                                        {data.analysis.health_summary}
                                    </p>

                                    {/* Health Indices Grid */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {(data?.analysis?.health_indices || []).map((idx, i) => (
                                            <HealthIndexMini key={i} index={idx} />
                                        ))}
                                    </div>

                                    {/* Avoid Ingredients Warning */}
                                    {(data?.analysis?.nutritional_needs?.avoidIngredients || []).length > 0 && (
                                        <div className="mt-3 p-2 bg-red-50 dark:bg-red-950/20 rounded-lg flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                            <span className="text-xs text-red-600 dark:text-red-400">
                                                Cần tránh: {(data?.analysis?.nutritional_needs?.avoidIngredients || []).join(", ")}
                                            </span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Tabbed Recommendations */}
                        <Tabs defaultValue="food" className="w-full">
                            <TabsList className="w-full grid grid-cols-2 h-12">
                                <TabsTrigger value="food" className="gap-2">
                                    <span className="text-lg">🍖</span>
                                    Thức ăn
                                    <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                                        {(data?.food_recommendations || []).filter(f => (f?.match_point || 0) > 0).length}
                                    </Badge>
                                </TabsTrigger>
                                <TabsTrigger value="service" className="gap-2">
                                    <span className="text-lg">🏥</span>
                                    Dịch vụ
                                    <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                                        {(data?.service_recommendations || []).length}
                                    </Badge>
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="food" className="mt-3">
                                {((data?.food_recommendations || []).filter(f => (f?.match_point || 0) > 0)).length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {(data?.food_recommendations || [])
                                            .filter(f => (f?.match_point || 0) > 0)
                                            .map((food) => (
                                                <FoodCardCompact
                                                    key={food?.product_id || food?.product_name || Math.random()}
                                                    food={food}
                                                    onBuy={handleBuyProduct}
                                                />
                                            ))}
                                    </div>
                                ) : (
                                    <EmptyState
                                        emoji="🍽️"
                                        title="Không tìm thấy sản phẩm phù hợp"
                                        description="Hiện chưa có thức ăn nào phù hợp với thú cưng của bạn trong hệ thống"
                                    />
                                )}
                            </TabsContent>

                            <TabsContent value="service" className="mt-3">
                                {(data?.service_recommendations || []).length > 0 ? (
                                    <div className="space-y-3">
                                        {(data?.service_recommendations || []).map((service) => (
                                            <ServiceCardCompact
                                                key={service?.service_id || service?.service_name || Math.random()}
                                                service={service}
                                                onBook={handleBookService}
                                                urgencyStyle={getUrgencyStyle(service?.urgency || 'MEDIUM')}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState
                                        emoji="🏥"
                                        title="Không có dịch vụ được gợi ý"
                                        description="Thú cưng của bạn đang rất khỏe mạnh!"
                                    />
                                )}
                            </TabsContent>
                        </Tabs>
                    </>
                )}
            </div>
        </TooltipProvider>
    )
}

// ============ Sub Components ============

function RadialScoreChart({ score, size = 120 }: { score: number; size?: number }) {
    const strokeWidth = 8
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (score / 100) * circumference

    const getScoreColor = (s: number) => {
        if (s >= 80) return "#22c55e"
        if (s >= 60) return "#3b82f6"
        if (s >= 40) return "#eab308"
        return "#ef4444"
    }

    const getScoreLabel = (s: number) => {
        if (s >= 80) return "Tuyệt vời"
        if (s >= 60) return "Tốt"
        if (s >= 40) return "Khá"
        return "Cần chú ý"
    }

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90" width={size} height={size}>
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-gray-200 dark:text-gray-700"
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={getScoreColor(score)}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold" style={{ color: getScoreColor(score) }}>
                    {score}
                </span>
                <span className="text-xs text-muted-foreground">{getScoreLabel(score)}</span>
            </div>
        </div>
    )
}

function HealthIndexMini({ index }: { index: PetHealthIndex }) {
    const colorClass = iconColorMap[index.icon || "heart"] || "text-gray-500 bg-gray-100"
    const [iconColor, bgColor] = colorClass.split(" ")

    const getBarColor = (value: number) => {
        if (value >= 80) return "bg-green-500"
        if (value >= 60) return "bg-blue-500"
        if (value >= 40) return "bg-yellow-500"
        return "bg-red-500"
    }

    return (
        <div className="p-3 rounded-xl border bg-card hover:shadow-md transition-all">
            {/* Header: Icon + Label + Score */}
            <div className="flex items-center gap-2 mb-2">
                <span className={`p-1.5 rounded-lg ${bgColor}`}>
                    <span className={iconColor}>
                        {iconMap[index.icon || "heart"]}
                    </span>
                </span>
                <span className="text-sm font-semibold flex-1">{index.label}</span>
                <span className={`text-lg font-bold ${index.value >= 80 ? "text-green-600" :
                    index.value >= 60 ? "text-blue-600" :
                        index.value >= 40 ? "text-yellow-600" :
                            "text-red-600"
                    }`}>{index.value}</span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                <div
                    className={`h-full ${getBarColor(index.value)} transition-all duration-500`}
                    style={{ width: `${index.value}%` }}
                />
            </div>

            {/* Reason Text */}
            <p className="text-xs text-muted-foreground leading-relaxed">
                {index.reason}
            </p>
        </div>
    )
}

function FoodCardCompact({ food, onBuy }: { food: FoodRecommendation; onBuy: (id: string) => void }) {
    const getMatchBadgeStyle = (score: number) => {
        if (score >= 80) return "bg-green-100 text-green-700 border-green-200"
        if (score >= 60) return "bg-blue-100 text-blue-700 border-blue-200"
        return "bg-yellow-100 text-yellow-700 border-yellow-200"
    }

    return (
        <Card className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-0">
                <div className="flex">
                    {/* Image */}
                    <div className="relative w-24 h-24 flex-shrink-0 bg-secondary">
                        {food.product_image ? (
                            <Image
                                src={food.product_image}
                                alt={food.product_name}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl">🍖</div>
                        )}
                        {/* Match Score Badge */}
                        <div className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-xs font-bold ${getMatchBadgeStyle(food.match_point)}`}>
                            {food.match_point}%
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-3 flex flex-col min-w-0">
                        <h4 className="font-semibold text-sm line-clamp-1">{food.product_name}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 flex-1">
                            {food.reasoning}
                        </p>

                        <div className="flex items-center justify-between mt-2">
                            <div>
                                {food.sale_price && food.sale_price < food.price ? (
                                    <div className="flex items-center gap-1">
                                        <span className="font-bold text-sm text-red-600">
                                            {food.sale_price.toLocaleString("vi-VN")}đ
                                        </span>
                                        <span className="text-xs text-muted-foreground line-through">
                                            {food.price.toLocaleString("vi-VN")}đ
                                        </span>
                                    </div>
                                ) : (
                                    <span className="font-bold text-sm">
                                        {food.price.toLocaleString("vi-VN")}đ
                                    </span>
                                )}
                            </div>
                            <Button size="sm" className="h-7 px-2 text-xs" onClick={() => onBuy(food.product_id)}>
                                <ShoppingCart className="w-3 h-3 mr-1" />
                                Mua
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Metrics Bar */}
                <div className="px-3 pb-2">
                    <div className="flex gap-1">
                        {Object.entries(food.metrics).map(([key, value]) => (
                            <Tooltip key={key}>
                                <TooltipTrigger asChild>
                                    <div className="flex-1 h-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden cursor-help">
                                        <div
                                            className={`h-full ${value >= 80 ? "bg-green-500" : value >= 50 ? "bg-blue-500" : "bg-red-500"
                                                }`}
                                            style={{ width: `${value}%` }}
                                        />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="text-xs">{formatMetricLabel(key)}: {value}%</p>
                                </TooltipContent>
                            </Tooltip>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function ServiceCardCompact({
    service,
    onBook,
    urgencyStyle
}: {
    service: ServiceRecommendation
    onBook: (id: string) => void
    urgencyStyle: { bg: string; text: string; label: string }
}) {
    return (
        <Card className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-3">
                <div className="flex items-start gap-3">
                    {/* Left: Urgency + Score */}
                    <div className="flex flex-col items-center gap-1">
                        <Badge className={`${urgencyStyle.bg} ${urgencyStyle.text} text-xs px-1.5`}>
                            {urgencyStyle.label}
                        </Badge>
                        <RadialScoreChart score={service.match_point} size={50} />
                    </div>

                    {/* Middle: Info */}
                    <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm">{service.service_name}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {service.reasoning}
                        </p>
                        {service.urgency_reason && (
                            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {service.urgency_reason}
                            </p>
                        )}
                    </div>

                    {/* Right: Price + CTA */}
                    <div className="flex flex-col items-end gap-2">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {service.price_range.min.toLocaleString("vi-VN")}đ
                        </span>
                        <Button
                            size="sm"
                            variant={service.urgency === "CRITICAL" ? "destructive" : "default"}
                            className="h-7 px-2 text-xs"
                            onClick={() => onBook(service.service_id)}
                        >
                            <Calendar className="w-3 h-3 mr-1" />
                            Đặt lịch
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function EmptyState({ emoji, title, description }: { emoji: string; title: string; description: string }) {
    return (
        <div className="text-center py-8">
            <span className="text-4xl mb-3 block">{emoji}</span>
            <h4 className="font-semibold text-foreground">{title}</h4>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
    )
}

function formatMetricLabel(key: string): string {
    const labels: Record<string, string> = {
        species_match: "Phù hợp loài",
        life_stage_fit: "Giai đoạn",
        allergy_safety: "An toàn dị ứng",
        health_tag_match: "Sức khỏe",
        nutritional_balance: "Dinh dưỡng"
    }
    return labels[key] || key
}
