"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Sparkles,
    ShoppingCart,
    Calendar,
    AlertTriangle,
    Heart,
    Bone,
    Dumbbell,
    Pill,
    Stethoscope,
    Zap,
    Scissors,
    Star,
    Clock,
    RefreshCw,
    Activity,
    X,
} from "lucide-react"
import { AISuggestionResponse } from "@/lib/types/ai-suggestions"
import { aiAPI } from "@/lib/api"
import { FeatureGate } from "@/components/ui/feature-gate"

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
    protein: "text-orange-500 bg-orange-100 dark:bg-orange-900/30",
    heart: "text-red-500 bg-red-100 dark:bg-red-900/30",
    bone: "text-amber-600 bg-amber-100 dark:bg-amber-900/30",
    stomach: "text-green-500 bg-green-100 dark:bg-green-900/30",
    vitamin: "text-purple-500 bg-purple-100 dark:bg-purple-900/30",
    checkup: "text-blue-500 bg-blue-100 dark:bg-blue-900/30",
    energy: "text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30",
    fur: "text-pink-500 bg-pink-100 dark:bg-pink-900/30",
}

const loadingMessages = [
    { emoji: "🐕", text: "Đang phân tích hồ sơ sức khỏe..." },
    { emoji: "🔬", text: "AI đang đọc dữ liệu dinh dưỡng..." },
    { emoji: "🍖", text: "Tìm kiếm thức ăn phù hợp nhất..." },
    { emoji: "💊", text: "Kiểm tra lịch tiêm phòng..." },
    { emoji: "📊", text: "Tính toán chỉ số sức khỏe..." },
    { emoji: "✨", text: "Hoàn tất phân tích AI..." },
]

function scoreColor(score: number) {
    if (score >= 80) return { bar: "bg-green-500", text: "text-green-700 dark:text-green-400", label: "Tốt" }
    if (score >= 60) return { bar: "bg-amber-500", text: "text-amber-700 dark:text-amber-400", label: "Khá" }
    if (score >= 40) return { bar: "bg-orange-500", text: "text-orange-700 dark:text-orange-400", label: "Cần cải thiện" }
    return { bar: "bg-red-500", text: "text-red-700 dark:text-red-400", label: "Nguy hiểm" }
}

function urgencyBadge(urgency: string) {
    switch (urgency) {
        case "CRITICAL": return "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400"
        case "HIGH": return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400"
        case "MEDIUM": return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400"
        default: return "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400"
    }
}

function urgencyLabel(urgency: string) {
    const map: Record<string, string> = { CRITICAL: "Khẩn cấp", HIGH: "Ưu tiên cao", MEDIUM: "Trung bình", LOW: "Thấp" }
    return map[urgency] ?? urgency
}

function statusLabel(status: string) {
    const map: Record<string, string> = { low: "Thấp", medium: "Trung bình", high: "Cao" }
    return map[status] ?? status
}

export function AISuggestions({ petId, petName }: AISuggestionsProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<AISuggestionResponse | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [loadingStep, setLoadingStep] = useState(0)
    const [isMounted, setIsMounted] = useState(false)
    const [isCached, setIsCached] = useState(false)
    const [isOutdated, setIsOutdated] = useState(false)
    const [daysSince, setDaysSince] = useState<number | undefined>()

    useEffect(() => { setIsMounted(true) }, [])

    useEffect(() => {
        if (!loading) return
        const interval = setInterval(() => {
            setLoadingStep(prev => (prev + 1) % loadingMessages.length)
        }, 1500)
        return () => clearInterval(interval)
    }, [loading])

    useEffect(() => { fetchCachedAnalysis() }, [petId])

    const fetchCachedAnalysis = async () => {
        try {
            const result = await aiAPI.getCachedHealthAnalysis(petId)
            if (result.success && result.data?.analysis) {
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
        setData(null)
        setLoadingStep(0)
        try {
            const result = await aiAPI.suggestions(petId)
            if (result.success && result.data) {
                setData(result.data as AISuggestionResponse)
                setIsCached(false)
                setIsOutdated(false)
                setDaysSince(0)
            } else {
                setError(result.message || "Không thể tải gợi ý. Vui lòng thử lại.")
            }
        } catch (err) {
            console.error(err)
            setError("Không thể tải gợi ý. Vui lòng thử lại.")
        } finally {
            setLoading(false)
        }
    }

    const avgHealthScore = data?.analysis?.health_indices?.length
        ? Math.round(data.analysis.health_indices.reduce((s, i) => s + (i?.value || 0), 0) / data.analysis.health_indices.length)
        : 0

    if (!isMounted) return null

    // ─── Empty state ───────────────────────────────────────────────────────────
    if (!data && !loading && !error) {
        return (
            <FeatureGate featureKey="ai_recommendations" fullScreen>
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <div className="relative mb-6">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-xl shadow-teal-200 dark:shadow-teal-900/40">
                            <Activity className="w-11 h-11 text-white" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center text-sm shadow">💊</div>
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">Phân tích Sức khỏe AI</h3>
                    <p className="text-muted-foreground max-w-sm mb-6 text-sm leading-relaxed">
                        Nhận báo cáo sức khỏe, gợi ý thức ăn và dịch vụ phù hợp nhất dựa trên dữ liệu của <span className="font-semibold text-foreground">{petName}</span>
                    </p>
                    <Button
                        onClick={fetchSuggestions}
                        size="lg"
                        className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white hover:opacity-90 shadow-lg hover:shadow-xl transition-all px-8"
                    >
                        <Sparkles className="w-5 h-5 mr-2" />
                        Phân tích ngay
                    </Button>
                </div>
            </FeatureGate>
        )
    }

    // ─── Loading state ─────────────────────────────────────────────────────────
    if (loading) {
        return (
            <FeatureGate featureKey="ai_recommendations" fullScreen>
                <div className="flex flex-col items-center justify-center py-14 px-4">
                    <div className="relative w-28 h-28 mb-6">
                        <div className="absolute inset-0 rounded-full border-4 border-teal-100 dark:border-teal-900" />
                        <svg className="absolute inset-0 w-28 h-28 animate-spin" style={{ animationDuration: "2s" }} viewBox="0 0 112 112">
                            <circle cx="56" cy="56" r="52" fill="none" stroke="url(#hg)" strokeWidth="4" strokeDasharray="90 240" strokeLinecap="round" />
                            <defs>
                                <linearGradient id="hg" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#10b981" />
                                    <stop offset="50%" stopColor="#06b6d4" />
                                    <stop offset="100%" stopColor="#3b82f6" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-4xl">{loadingMessages[loadingStep].emoji}</span>
                        </div>
                    </div>
                    <p className="text-base font-medium text-foreground mb-4">{loadingMessages[loadingStep].text}</p>
                    <div className="flex gap-1.5">
                        {loadingMessages.map((_, idx) => (
                            <div key={idx} className={`h-1.5 rounded-full transition-all duration-500 ${idx === loadingStep ? "w-6 bg-teal-500" : idx < loadingStep ? "w-1.5 bg-teal-200" : "w-1.5 bg-gray-200 dark:bg-gray-700"}`} />
                        ))}
                    </div>
                </div>
            </FeatureGate>
        )
    }

    // ─── Error state ───────────────────────────────────────────────────────────
    if (error) {
        return (
            <FeatureGate featureKey="ai_recommendations" fullScreen>
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                    <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-3">
                        <X className="w-7 h-7 text-red-500" />
                    </div>
                    <p className="font-medium text-red-600 dark:text-red-400 mb-4">{error}</p>
                    <Button variant="outline" onClick={fetchSuggestions}>
                        <RefreshCw className="w-4 h-4 mr-2" />Thử lại
                    </Button>
                </div>
            </FeatureGate>
        )
    }

    if (!data) return null

    // ─── Main result ───────────────────────────────────────────────────────────
    return (
        <FeatureGate featureKey="ai_recommendations" fullScreen>
            <div className="space-y-4">

                {/* ── Outdated banner ── */}
                {isOutdated && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                        <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <p className="text-sm text-amber-700 dark:text-amber-400 flex-1">
                            Phân tích thực hiện cách đây <strong>{daysSince} ngày</strong>. Nên cập nhật để chính xác hơn.
                        </p>
                        <Button size="sm" variant="outline" onClick={fetchSuggestions} className="flex-shrink-0 h-7 px-2 text-xs border-amber-300 text-amber-700">
                            <RefreshCw className="w-3 h-3 mr-1" />Cập nhật
                        </Button>
                    </div>
                )}

                {/* ── Fallback notice ── */}
                {data?.is_fallback && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                        <p className="text-xs text-yellow-700 dark:text-yellow-400">Đang dùng gợi ý cơ bản · {data.fallback_reason}</p>
                    </div>
                )}

                {/* ── Hero: Health Summary ── */}
                <Card className="overflow-hidden border-0 shadow-sm">
                    <div className="relative bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-5 text-white">
                        <div className="flex items-center justify-between mb-4">
                            <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs">
                                <Activity className="w-3 h-3 mr-1" />
                                Sức khỏe AI
                                {isCached && daysSince !== undefined && (
                                    <span className="ml-1 opacity-80">· {daysSince === 0 ? "hôm nay" : `${daysSince} ngày trước`}</span>
                                )}
                            </Badge>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={fetchSuggestions}
                                className="h-7 px-2 text-xs text-white/80 hover:text-white hover:bg-white/15"
                            >
                                <RefreshCw className="w-3 h-3 mr-1" />Phân tích lại
                            </Button>
                        </div>

                        {/* Summary + Score row */}
                        <div className="flex items-start gap-4">
                            <div className="flex-1">
                                <p className="text-white/70 text-xs font-medium uppercase tracking-widest mb-1">Tóm tắt sức khỏe</p>
                                <p className="text-sm leading-relaxed text-white/90">
                                    {data.analysis?.health_summary || "—"}
                                </p>
                            </div>
                            {/* Circular score */}
                            <div className="flex-shrink-0 text-center">
                                <div className="relative w-16 h-16">
                                    <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                                        <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="6" />
                                        <circle
                                            cx="32" cy="32" r="28"
                                            fill="none" stroke="white" strokeWidth="6"
                                            strokeDasharray={`${(avgHealthScore / 100) * 175.9} 175.9`}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-lg font-bold text-white leading-none">{avgHealthScore}</span>
                                        <span className="text-[9px] text-white/70">/100</span>
                                    </div>
                                </div>
                                <p className="text-[10px] text-white/70 mt-1">Điểm TB</p>
                            </div>
                        </div>

                        {/* Status pills */}
                        <div className="flex flex-wrap gap-2 mt-4">
                            {data.analysis?.weight_status && (
                                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-medium">⚖️ {data.analysis.weight_status}</span>
                            )}
                            {data.analysis?.activity_level && (
                                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-medium">🏃 {data.analysis.activity_level}</span>
                            )}
                        </div>
                    </div>

                    {/* Nutritional needs */}
                    {data.analysis?.nutritional_needs && (
                        <CardContent className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20">
                            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-2">Nhu cầu dinh dưỡng</p>
                            <div className="flex flex-wrap gap-1.5">
                                {data.analysis.nutritional_needs.protein && (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs border border-emerald-200 dark:border-emerald-800">
                                        🥩 Protein: {data.analysis.nutritional_needs.protein}
                                    </span>
                                )}
                                {data.analysis.nutritional_needs.fat && (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs border border-emerald-200 dark:border-emerald-800">
                                        🧈 Chất béo: {data.analysis.nutritional_needs.fat}
                                    </span>
                                )}
                                {data.analysis.nutritional_needs.fiber && (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs border border-emerald-200 dark:border-emerald-800">
                                        🌿 Chất xơ: {data.analysis.nutritional_needs.fiber}
                                    </span>
                                )}
                                {data.analysis.nutritional_needs.specialDiet && (
                                    <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-xs border border-blue-200 dark:border-blue-800">
                                        🍽️ {data.analysis.nutritional_needs.specialDiet}
                                    </span>
                                )}
                                {(data.analysis.nutritional_needs.avoidIngredients?.length ?? 0) > 0 && (
                                    <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 text-xs border border-red-200 dark:border-red-800">
                                        ⚠️ Tránh: {data.analysis.nutritional_needs.avoidIngredients.join(", ")}
                                    </span>
                                )}
                            </div>
                        </CardContent>
                    )}
                </Card>

                {/* ── Health Indices — detailed per-index analysis ── */}
                {(data.analysis?.health_indices?.length ?? 0) > 0 && (
                    <Card className="overflow-hidden shadow-sm">
                        <div className="flex items-center gap-2.5 px-4 pt-4 pb-3 border-b">
                            <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                                <span className="text-sm">📊</span>
                            </div>
                            <h3 className="font-semibold text-sm">Phân tích chi tiết từng chỉ số</h3>
                        </div>
                        <CardContent className="p-4 space-y-4">
                            {data.analysis!.health_indices!.map((index, i) => {
                                const cfg = scoreColor(index.value)
                                const iconKey = index.icon || "checkup"
                                return (
                                    <div key={i} className="space-y-2 pb-4 border-b last:border-0 last:pb-0">
                                        {/* Index header */}
                                        <div className="flex items-center gap-2">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconColorMap[iconKey] ?? "text-gray-500 bg-gray-100"}`}>
                                                {iconMap[iconKey] ?? <Activity className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-sm font-semibold text-foreground">{index.label}</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`text-xs font-bold ${cfg.text}`}>{index.value}/100</span>
                                                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${cfg.text} border-current`}>
                                                            {cfg.label}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${cfg.bar} rounded-full transition-all duration-700`}
                                                        style={{ width: `${index.value}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Mức độ + lý do */}
                                        <div className="ml-10 space-y-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs text-muted-foreground">Mức độ:</span>
                                                <Badge variant="secondary" className="text-[10px] px-1.5 h-4">{statusLabel(index.status)}</Badge>
                                            </div>
                                            {index.reason && (
                                                <p className="text-xs text-foreground/70 leading-relaxed">{index.reason}</p>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </CardContent>
                    </Card>
                )}

                {/* ── Food recommendations ── */}
                {(data.food_recommendations?.length ?? 0) > 0 && (
                    <div className="space-y-3">
                        <h3 className="font-semibold text-base flex items-center gap-2">
                            <span className="text-xl">🍗</span> Thức ăn phù hợp
                            <Badge variant="secondary" className="ml-auto text-xs">{data.food_recommendations!.length} sản phẩm</Badge>
                        </h3>
                        {data.food_recommendations!.map((food, i) => (
                            <Card key={i} className="overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                                <CardContent className="p-0">
                                    <div className="flex">
                                        {/* Large product image */}
                                        <div className="w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
                                            {food.product_image ? (
                                                <Image
                                                    src={food.product_image}
                                                    alt={food.product_name}
                                                    width={128}
                                                    height={128}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-4xl">🍖</div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                                            <div>
                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                    <p className="font-bold text-sm text-foreground leading-tight">{food.product_name}</p>
                                                    {food.match_point !== undefined && (
                                                        <div className="flex items-center gap-1 flex-shrink-0 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full">
                                                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                                            <span className="text-xs font-bold text-amber-700 dark:text-amber-400">{food.match_point}%</span>
                                                        </div>
                                                    )}
                                                </div>
                                                {food.reasoning && (
                                                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{food.reasoning}</p>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between mt-2 gap-2">
                                                <div>
                                                    {food.sale_price ? (
                                                        <div className="flex items-baseline gap-1.5">
                                                            <span className="font-bold text-emerald-600 text-sm">{food.sale_price.toLocaleString("vi-VN")}đ</span>
                                                            <span className="text-xs text-muted-foreground line-through">{food.price.toLocaleString("vi-VN")}đ</span>
                                                        </div>
                                                    ) : food.price ? (
                                                        <span className="font-bold text-foreground text-sm">{food.price.toLocaleString("vi-VN")}đ</span>
                                                    ) : null}
                                                </div>
                                                <Button
                                                    size="sm"
                                                    className="h-7 px-3 text-xs bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg shadow-sm"
                                                    onClick={() => router.push(`/dashboard/customer?tab=marketplace`)}
                                                >
                                                    <ShoppingCart className="w-3 h-3 mr-1.5" />Mua ngay
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* ── Service recommendations ── */}
                {(data.service_recommendations?.length ?? 0) > 0 && (
                    <div className="space-y-3">
                        <h3 className="font-semibold text-base flex items-center gap-2">
                            <span className="text-xl">🩺</span> Dịch vụ gợi ý
                            <Badge variant="secondary" className="ml-auto text-xs">{data.service_recommendations!.length} dịch vụ</Badge>
                        </h3>
                        {data.service_recommendations!.map((svc, i) => {
                            const urgencyStyle = {
                                CRITICAL: "border-l-red-500 bg-red-50/50 dark:bg-red-950/10",
                                HIGH: "border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/10",
                                MEDIUM: "border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/10",
                                LOW: "border-l-green-500 bg-green-50/50 dark:bg-green-950/10",
                            }[svc.urgency] ?? "border-l-gray-300"

                            return (
                                <Card key={i} className={`overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 border-l-4 ${urgencyStyle}`}>
                                    <CardContent className="p-0">
                                        <div className="flex">
                                            {/* Large service image */}
                                            <div className="w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30">
                                                {svc.service_image ? (
                                                    <Image
                                                        src={svc.service_image}
                                                        alt={svc.service_name}
                                                        width={128}
                                                        height={128}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-4xl">🩺</div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                                                <div>
                                                    <div className="flex items-start justify-between gap-2 mb-1">
                                                        <p className="font-bold text-sm text-foreground leading-tight">{svc.service_name}</p>
                                                        <Badge className={`text-[10px] flex-shrink-0 ${urgencyBadge(svc.urgency)}`} variant="outline">
                                                            {urgencyLabel(svc.urgency)}
                                                        </Badge>
                                                    </div>
                                                    {svc.urgency_reason && (
                                                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{svc.urgency_reason}</p>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between mt-2 gap-2">
                                                    <div className="space-y-0.5">
                                                        {svc.price_range && (
                                                            <p className="text-xs font-semibold text-foreground">
                                                                {svc.price_range.min.toLocaleString("vi-VN")} – {svc.price_range.max.toLocaleString("vi-VN")}đ
                                                            </p>
                                                        )}
                                                        {svc.recommended_date && (
                                                            <p className="text-[10px] text-teal-600">📅 {new Date(svc.recommended_date).toLocaleDateString("vi-VN")}</p>
                                                        )}
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        className="h-7 px-3 text-xs bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white rounded-lg shadow-sm"
                                                        onClick={() => router.push(`/dashboard/customer?tab=booking&serviceId=${svc.service_id}`)}
                                                    >
                                                        <Calendar className="w-3 h-3 mr-1.5" />Đặt lịch
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>
        </FeatureGate>
    )
}
