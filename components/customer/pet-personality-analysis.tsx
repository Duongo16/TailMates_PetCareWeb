"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Sparkles,
    AlertTriangle,
    Dumbbell,
    Scissors,
    Utensils,
    Syringe,
    GraduationCap,
    Shield,
    Clock,
    RefreshCw,
    X,
    Zap,
    Flame,
} from "lucide-react"
import { aiAPI } from "@/lib/api"
import { PersonalityAnalysisResult } from "@/lib/types/ai-suggestions"

interface PetPersonalityAnalysisProps {
    petId: string
    petName: string
}

const loadingMessages = [
    { emoji: "🐕", text: "Đang phân tích tính cách bé cưng..." },
    { emoji: "🧬", text: "AI đang nghiên cứu gen giống loài..." },
    { emoji: "📚", text: "Tra cứu kiến thức thú y chuyên sâu..." },
    { emoji: "🔍", text: "Phân tích hành vi và thói quen..." },
    { emoji: "💡", text: "Đưa ra các khuyến nghị chăm sóc..." },
    { emoji: "✨", text: "Hoàn tất báo cáo tính cách..." },
]

export function PetPersonalityAnalysis({ petId, petName }: PetPersonalityAnalysisProps) {
    const [loading, setLoading] = useState(false)
    const [loadingStep, setLoadingStep] = useState(0)
    const [data, setData] = useState<PersonalityAnalysisResult | null>(null)
    const [isCached, setIsCached] = useState(false)
    const [isOutdated, setIsOutdated] = useState(false)
    const [daysSince, setDaysSince] = useState<number | undefined>()
    const [error, setError] = useState<string | null>(null)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => { setIsMounted(true) }, [])

    useEffect(() => {
        if (!loading) return
        const interval = setInterval(() => {
            setLoadingStep(prev => (prev + 1) % loadingMessages.length)
        }, 1500)
        return () => clearInterval(interval)
    }, [loading])

    useEffect(() => {
        fetchCachedAnalysis()
    }, [petId])

    const fetchCachedAnalysis = async () => {
        try {
            const result = await aiAPI.getPersonalityAnalysis(petId)
            if (result.success && result.data?.analysis) {
                setData(result.data.analysis)
                setIsCached(result.data.is_cached)
                setIsOutdated(result.data.is_outdated)
                setDaysSince(result.data.days_since_analysis)
            }
        } catch (err) {
            console.error("Failed to fetch cached analysis:", err)
        }
    }

    const analyzePersonality = async () => {
        setLoading(true)
        setError(null)
        setData(null)
        setLoadingStep(0)

        try {
            const result = await aiAPI.analyzePersonality(petId)
            if (result.success && result.data) {
                setData(result.data.analysis)
                setIsCached(false)
                setIsOutdated(false)
                setDaysSince(0)
            } else {
                setError(result.message || "Không thể phân tích. Vui lòng thử lại.")
            }
        } catch (err) {
            console.error("Failed to analyze:", err)
            setError("Không thể phân tích. Vui lòng thử lại.")
        } finally {
            setLoading(false)
        }
    }

    const shedLevelConfig = {
        HIGH: { label: "Rụng nhiều", color: "bg-red-100 text-red-700 border-red-200", bar: "bg-red-400", pct: "100%" },
        MEDIUM: { label: "Rụng vừa", color: "bg-amber-100 text-amber-700 border-amber-200", bar: "bg-amber-400", pct: "55%" },
        LOW: { label: "Rụng ít", color: "bg-green-100 text-green-700 border-green-200", bar: "bg-green-400", pct: "20%" },
    } as const

    // Guard: prevent SSR mismatch
    if (!isMounted) return null

    // ─── Empty state ─────────────────────────────────────────────────────────
    if (!data && !loading && !error) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="relative mb-6">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl shadow-purple-200 dark:shadow-purple-900/40">
                        <Sparkles className="w-11 h-11 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center text-sm shadow">✨</div>
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Báo cáo tính cách AI</h3>
                <p className="text-muted-foreground max-w-sm mb-6 text-sm leading-relaxed">
                    Nhận phân tích chi tiết về tính cách, đặc điểm giống loài, hướng dẫn chăm sóc và cảnh báo sức khỏe dành riêng cho <span className="font-semibold text-foreground">{petName}</span>
                </p>
                <Button
                    onClick={analyzePersonality}
                    size="lg"
                    className="bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 text-white hover:opacity-90 shadow-lg hover:shadow-xl transition-all px-8"
                >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Phân tích ngay
                </Button>
            </div>
        )
    }

    // ─── Loading state ────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-14 px-4">
                <div className="relative w-28 h-28 mb-6">
                    <div className="absolute inset-0 rounded-full border-4 border-purple-100 dark:border-purple-900" />
                    <svg className="absolute inset-0 w-28 h-28 animate-spin" style={{ animationDuration: "2s" }} viewBox="0 0 112 112">
                        <circle cx="56" cy="56" r="52" fill="none" stroke="url(#pg)" strokeWidth="4" strokeDasharray="90 240" strokeLinecap="round" />
                        <defs>
                            <linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#8b5cf6" />
                                <stop offset="50%" stopColor="#ec4899" />
                                <stop offset="100%" stopColor="#f97316" />
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
                        <div key={idx} className={`h-1.5 rounded-full transition-all duration-500 ${idx === loadingStep ? "w-6 bg-purple-500" : idx < loadingStep ? "w-1.5 bg-purple-200" : "w-1.5 bg-gray-200 dark:bg-gray-700"}`} />
                    ))}
                </div>
            </div>
        )
    }

    // ─── Error state ──────────────────────────────────────────────────────────
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-3">
                    <X className="w-7 h-7 text-red-500" />
                </div>
                <p className="font-medium text-red-600 dark:text-red-400 mb-4">{error}</p>
                <Button variant="outline" onClick={analyzePersonality}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Thử lại
                </Button>
            </div>
        )
    }

    // ─── No data (should not hit, but guard) ─────────────────────────────────
    if (!data) return null

    const shedCfg = shedLevelConfig[data.breed_specs?.shedding_level as keyof typeof shedLevelConfig] ?? shedLevelConfig.MEDIUM

    // ─── Main result ──────────────────────────────────────────────────────────
    return (
        <div className="space-y-4">

            {/* ── Outdated banner ── */}
            {isOutdated && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                    <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <p className="text-sm text-amber-700 dark:text-amber-400 flex-1">
                        Phân tích thực hiện cách đây <strong>{daysSince} ngày</strong>. Nên cập nhật để chính xác hơn.
                    </p>
                    <Button size="sm" variant="outline" onClick={analyzePersonality} className="flex-shrink-0 h-7 px-2 text-xs border-amber-300 text-amber-700">
                        <RefreshCw className="w-3 h-3 mr-1" />Cập nhật
                    </Button>
                </div>
            )}

            {/* ── Hero: Personality type card ── */}
            <Card className="overflow-hidden border-0 shadow-sm">
                <div className="relative bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 p-5 text-white">
                    {/* Top row: badge + re-analyze */}
                    <div className="flex items-center justify-between mb-4">
                        <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs">
                            <Sparkles className="w-3 h-3 mr-1" />
                            AI Analysis
                            {isCached && daysSince !== undefined && (
                                <span className="ml-1 opacity-80">· {daysSince === 0 ? "hôm nay" : `${daysSince} ngày trước`}</span>
                            )}
                        </Badge>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={analyzePersonality}
                            className="h-7 px-2 text-xs text-white/80 hover:text-white hover:bg-white/15"
                        >
                            <RefreshCw className="w-3 h-3 mr-1" />Phân tích lại
                        </Button>
                    </div>

                    {/* Personality type */}
                    <div className="flex items-start gap-3">
                        <div className="text-4xl leading-none mt-0.5">🌟</div>
                        <div>
                            <p className="text-white/70 text-xs font-medium uppercase tracking-widest mb-0.5">Kiểu tính cách</p>
                            <h2 className="text-xl font-bold leading-tight">{data.type}</h2>
                        </div>
                    </div>

                    {/* Traits row */}
                    <div className="flex flex-wrap gap-1.5 mt-4">
                        {(data.traits || []).map((trait, i) => (
                            <span key={i} className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-medium">
                                {trait}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Behavior explanation */}
                <CardContent className="p-4 bg-violet-50/50 dark:bg-violet-950/20">
                    <div className="flex gap-2.5">
                        <div className="w-1 rounded-full bg-gradient-to-b from-violet-400 to-pink-400 flex-shrink-0" />
                        <p className="text-sm text-muted-foreground leading-relaxed">{data.behavior_explanation}</p>
                    </div>
                </CardContent>
            </Card>

            {/* ── Breed specs ── */}
            <Card className="overflow-hidden shadow-sm">
                <div className="flex items-center gap-2.5 px-4 pt-4 pb-3 border-b">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm">📖</span>
                    </div>
                    <h3 className="font-semibold text-sm">Đặc điểm Giống loài</h3>
                </div>
                <CardContent className="p-4 space-y-4">
                    {/* Appearance + Temperament grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3">
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">👀 Ngoại hình</p>
                            <ul className="space-y-1.5">
                                {(data.breed_specs?.appearance || []).map((item, i) => (
                                    <li key={i} className="text-sm text-foreground flex gap-2">
                                        <span className="text-blue-400 flex-shrink-0 mt-0.5">▸</span>{item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3">
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">💭 Tính cách giống</p>
                            <ul className="space-y-1.5">
                                {(data.breed_specs?.temperament || []).map((item, i) => (
                                    <li key={i} className="text-sm text-foreground flex gap-2">
                                        <span className="text-purple-400 flex-shrink-0 mt-0.5">▸</span>{item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-2">
                        {/* Exercise */}
                        <div className="rounded-xl border bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-3 text-center">
                            <Dumbbell className="w-4 h-4 mx-auto text-blue-500 mb-1.5" />
                            <p className="text-lg font-bold text-blue-700 dark:text-blue-300 leading-none">
                                {data.breed_specs?.exercise_minutes_per_day ?? "—"}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">phút/ngày</p>
                        </div>

                        {/* Shedding */}
                        <div className="rounded-xl border bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 p-3 text-center">
                            <Scissors className="w-4 h-4 mx-auto text-amber-500 mb-1.5" />
                            <div className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${shedCfg.color} mb-1`}>
                                {shedCfg.label}
                            </div>
                            <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-1">
                                <div className={`h-full ${shedCfg.bar} rounded-full transition-all`} style={{ width: shedCfg.pct }} />
                            </div>
                        </div>

                        {/* Grooming */}
                        <div className="rounded-xl border bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30 p-3 text-center flex flex-col items-center justify-start">
                            <span className="text-lg mb-1">✂️</span>
                            <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-3">
                                {data.breed_specs?.grooming_needs}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ── Care guide ── */}
            <Card className="overflow-hidden shadow-sm">
                <div className="flex items-center gap-2.5 px-4 pt-4 pb-3 border-b">
                    <div className="w-7 h-7 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm">📋</span>
                    </div>
                    <h3 className="font-semibold text-sm">Hướng dẫn Chăm sóc</h3>
                </div>
                <CardContent className="p-4 space-y-3">
                    {/* Nutrition */}
                    <div className="rounded-xl overflow-hidden border">
                        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950/30 border-b border-green-100 dark:border-green-900">
                            <Utensils className="w-3.5 h-3.5 text-green-600" />
                            <span className="text-xs font-semibold text-green-700 dark:text-green-400">Dinh dưỡng</span>
                            <span className="ml-auto text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full font-medium">
                                {data.care_guide?.nutrition?.meals_per_day ?? "?"} bữa/ngày
                            </span>
                        </div>
                        <div className="p-3 space-y-1.5">
                            <p className="text-xs text-muted-foreground italic mb-2">{data.care_guide?.nutrition?.food_type}</p>
                            {(data.care_guide?.nutrition?.tips || []).map((tip, i) => (
                                <div key={i} className="flex gap-2 text-sm">
                                    <span className="text-green-500 flex-shrink-0">✓</span>
                                    <span className="text-foreground">{tip}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Medical */}
                    <div className="rounded-xl overflow-hidden border">
                        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900">
                            <Syringe className="w-3.5 h-3.5 text-blue-600" />
                            <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">Y tế & Vaccine</span>
                        </div>
                        <div className="p-3">
                            {(data.care_guide?.medical?.vaccines || []).length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {(data.care_guide.medical.vaccines).map((v, i) => (
                                        <Badge key={i} variant="outline" className="text-xs border-blue-200 text-blue-700 bg-blue-50 dark:bg-blue-950/30">
                                            💉 {v}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                            <div className="space-y-1.5">
                                {(data.care_guide?.medical?.notes || []).map((note, i) => (
                                    <div key={i} className="flex gap-2 text-sm">
                                        <span className="text-blue-400 flex-shrink-0">📌</span>
                                        <span className="text-foreground">{note}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Training */}
                    <div className="rounded-xl overflow-hidden border">
                        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-100 dark:border-amber-900">
                            <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
                            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Huấn luyện</span>
                            {data.care_guide?.training?.command && (
                                <span className="ml-auto text-xs bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-medium">
                                    📢 {data.care_guide.training.command}
                                </span>
                            )}
                        </div>
                        <div className="p-3 space-y-1.5">
                            {(data.care_guide?.training?.tips || []).map((tip, i) => (
                                <div key={i} className="flex gap-2 text-sm">
                                    <span className="text-amber-500 flex-shrink-0">💡</span>
                                    <span className="text-foreground">{tip}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ── Warnings ── */}
            {((data.warnings?.genetic_diseases?.length ?? 0) > 0 ||
                (data.warnings?.dangerous_foods?.length ?? 0) > 0 ||
                (data.warnings?.environment_hazards?.length ?? 0) > 0) && (
                    <Card className="overflow-hidden shadow-sm border-red-100 dark:border-red-900/40">
                        <div className="flex items-center gap-2.5 px-4 pt-4 pb-3 border-b border-red-100 dark:border-red-900/30">
                            <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
                                <Shield className="w-3.5 h-3.5 text-red-600" />
                            </div>
                            <h3 className="font-semibold text-sm">Cảnh báo & Lưu ý</h3>
                        </div>
                        <CardContent className="p-4 space-y-3">
                            {/* Genetic diseases */}
                            {(data.warnings?.genetic_diseases || []).length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1.5 mb-2">
                                        <AlertTriangle className="w-3.5 h-3.5" />🧬 Bệnh di truyền thường gặp
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {data.warnings.genetic_diseases.map((d, i) => (
                                            <Badge key={i} variant="outline" className="text-xs border-red-200 text-red-700 bg-red-50 dark:bg-red-950/30">
                                                {d}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Dangerous foods */}
                            {(data.warnings?.dangerous_foods || []).length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-1.5 mb-2">
                                        <Flame className="w-3.5 h-3.5" />🚫 Thực phẩm nguy hiểm
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {data.warnings.dangerous_foods.map((f, i) => (
                                            <span key={i} className="px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 text-xs font-medium border border-orange-200 dark:border-orange-800">
                                                ❌ {f}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Environment hazards */}
                            {(data.warnings?.environment_hazards || []).length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-yellow-600 dark:text-yellow-400 flex items-center gap-1.5 mb-2">
                                        <Zap className="w-3.5 h-3.5" />🏠 Môi trường cần tránh
                                    </p>
                                    <div className="space-y-1.5">
                                        {data.warnings.environment_hazards.map((h, i) => (
                                            <div key={i} className="flex gap-2 text-sm">
                                                <span className="text-yellow-500 flex-shrink-0">⚠️</span>
                                                <span className="text-foreground">{h}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
        </div>
    )
}
