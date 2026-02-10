"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Sparkles,
    AlertTriangle,
    Heart,
    Dumbbell,
    Scissors,
    Utensils,
    Syringe,
    GraduationCap,
    Shield,
    Clock,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    X
} from "lucide-react"
import { aiAPI } from "@/lib/api"
import { PersonalityAnalysisResult } from "@/lib/types/ai-suggestions"

interface PetPersonalityAnalysisProps {
    petId: string
    petName: string
}

// Cute loading messages
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

    useEffect(() => {
        setIsMounted(true)
    }, [])
    const [expandedSections, setExpandedSections] = useState({
        personality: true,
        breed: true,
        care: true,
        warnings: true
    })

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

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }))
    }

    const getShedLevelLabel = (level: string) => {
        switch (level) {
            case "HIGH": return { label: "Rụng nhiều", color: "bg-red-100 text-red-700" }
            case "MEDIUM": return { label: "Rụng vừa", color: "bg-yellow-100 text-yellow-700" }
            case "LOW": return { label: "Rụng ít", color: "bg-green-100 text-green-700" }
            default: return { label: level, color: "bg-gray-100 text-gray-700" }
        }
    }

    // Initial state - no data yet
    if (!data && !loading) {
        return (
            <Card className="relative overflow-hidden border-2 border-dashed border-primary/30 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-purple-950/20 dark:via-pink-950/20 dark:to-orange-950/20">
                <CardContent className="p-6 text-center">
                    <div className="mb-4">
                        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-3 animate-pulse">
                            <Sparkles className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Phân tích tính cách AI
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                            Nhận báo cáo chi tiết về tính cách, đặc điểm giống loài, hướng dẫn chăm sóc và cảnh báo sức khỏe cho {petName}
                        </p>
                    </div>
                    <Button
                        onClick={analyzePersonality}
                        size="lg"
                        className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white hover:opacity-90 shadow-lg hover:shadow-xl transition-all"
                    >
                        <Sparkles className="w-5 h-5 mr-2" />
                        Phân tích tính cách
                    </Button>
                </CardContent>
            </Card>
        )
    }

    // Loading state
    if (loading) {
        return (
            <Card className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-100/50 via-pink-100/50 to-orange-100/50 animate-gradient-x" />
                <CardContent className="p-8 text-center relative">
                    {/* Animated Icon */}
                    <div className="relative w-32 h-32 mx-auto mb-6">
                        <div className="absolute inset-0 rounded-full border-4 border-purple-200 dark:border-purple-800" />
                        <svg className="absolute inset-0 w-32 h-32 animate-spin-slow" viewBox="0 0 128 128">
                            <circle
                                cx="64" cy="64" r="60"
                                fill="none"
                                stroke="url(#personality-gradient)"
                                strokeWidth="4"
                                strokeDasharray="100 280"
                                strokeLinecap="round"
                            />
                            <defs>
                                <linearGradient id="personality-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#8b5cf6" />
                                    <stop offset="50%" stopColor="#ec4899" />
                                    <stop offset="100%" stopColor="#f97316" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-5xl animate-bounce-slow">
                                {loadingMessages[loadingStep].emoji}
                            </span>
                        </div>
                    </div>

                    <div className="h-8">
                        <p className="text-lg font-medium text-foreground animate-fade-in">
                            {loadingMessages[loadingStep].text}
                        </p>
                    </div>

                    <div className="flex justify-center gap-2 mt-4">
                        {loadingMessages.map((_, idx) => (
                            <div
                                key={idx}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === loadingStep
                                    ? "w-6 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500"
                                    : idx < loadingStep
                                        ? "bg-purple-300"
                                        : "bg-gray-200 dark:bg-gray-700"
                                    }`}
                            />
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    // Error state
    if (error) {
        return (
            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
                <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                        <X className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="flex-1">
                        <p className="font-medium text-red-700 dark:text-red-400">{error}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={analyzePersonality}>
                        Thử lại
                    </Button>
                </CardContent>
            </Card>
        )
    }

    // Data display
    if (!isMounted) return null

    return (
        <div className="space-y-4">
            {/* Outdated Warning Banner */}
            {isOutdated && (
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
                                Bạn nên cập nhật để có thông tin chính xác hơn!
                            </p>
                        </div>
                        <Button size="sm" onClick={analyzePersonality} className="flex-shrink-0">
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Cập nhật
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Header with Re-analyze button */}
            {!isOutdated && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-purple-300 text-purple-700">
                            <Sparkles className="w-3 h-3 mr-1" />
                            AI Analysis
                        </Badge>
                        {isCached && daysSince !== undefined && (
                            <span className="text-xs text-muted-foreground">
                                Phân tích {daysSince === 0 ? "hôm nay" : `${daysSince} ngày trước`}
                            </span>
                        )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={analyzePersonality}>
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Phân tích lại
                    </Button>
                </div>
            )}

            {/* Section 1: Personality & Behavior */}
            <Card className="overflow-hidden">
                <CardHeader
                    className="pb-2 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleSection("personality")}
                >
                    <CardTitle className="flex items-center justify-between text-base">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                                <Heart className="w-4 h-4 text-purple-600" />
                            </div>
                            <span>🎭 Tính cách & Hành vi</span>
                        </div>
                        {expandedSections.personality ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </CardTitle>
                </CardHeader>
                {expandedSections.personality && (
                    <CardContent className="pt-0">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">🌟</span>
                                <div>
                                    <h4 className="font-bold text-lg text-purple-700 dark:text-purple-400">
                                        {data?.type}
                                    </h4>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {(data?.traits || []).map((trait, idx) => (
                                    <Badge key={idx} variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200">
                                        {trait}
                                    </Badge>
                                ))}
                            </div>

                            <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 p-3 rounded-lg">
                                💡 {data?.behavior_explanation}
                            </p>
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* Section 2: Breed Specs */}
            <Card className="overflow-hidden">
                <CardHeader
                    className="pb-2 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleSection("breed")}
                >
                    <CardTitle className="flex items-center justify-between text-base">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                <Dumbbell className="w-4 h-4 text-blue-600" />
                            </div>
                            <span>📖 Đặc điểm Giống loài</span>
                        </div>
                        {expandedSections.breed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </CardTitle>
                </CardHeader>
                {expandedSections.breed && (
                    <CardContent className="pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Appearance */}
                            <div className="space-y-2">
                                <h5 className="font-semibold text-sm flex items-center gap-2">
                                    👀 Ngoại hình
                                </h5>
                                <ul className="space-y-1">
                                    {(data?.breed_specs?.appearance || []).map((item, idx) => (
                                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                            <span className="text-blue-500">•</span> {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Temperament */}
                            <div className="space-y-2">
                                <h5 className="font-semibold text-sm flex items-center gap-2">
                                    💭 Tính cách giống
                                </h5>
                                <ul className="space-y-1">
                                    {(data?.breed_specs?.temperament || []).map((item, idx) => (
                                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                            <span className="text-blue-500">•</span> {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t">
                            <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl">
                                <Dumbbell className="w-5 h-5 mx-auto text-blue-600 mb-1" />
                                <p className="text-lg font-bold text-blue-700">{data?.breed_specs?.exercise_minutes_per_day}</p>
                                <p className="text-xs text-muted-foreground">phút/ngày</p>
                            </div>
                            <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-xl">
                                <Scissors className="w-5 h-5 mx-auto text-orange-600 mb-1" />
                                <Badge className={`text-xs ${getShedLevelLabel(data?.breed_specs?.shedding_level || "").color}`}>
                                    {getShedLevelLabel(data?.breed_specs?.shedding_level || "").label}
                                </Badge>
                            </div>
                            <div className="text-center p-3 bg-pink-50 dark:bg-pink-950/20 rounded-xl">
                                <span className="text-2xl">✂️</span>
                                <p className="text-xs text-muted-foreground mt-1">{data?.breed_specs?.grooming_needs}</p>
                            </div>
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* Section 3: Care Guide */}
            <Card className="overflow-hidden">
                <CardHeader
                    className="pb-2 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleSection("care")}
                >
                    <CardTitle className="flex items-center justify-between text-base">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                                <Utensils className="w-4 h-4 text-green-600" />
                            </div>
                            <span>📋 Hướng dẫn Chăm sóc</span>
                        </div>
                        {expandedSections.care ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </CardTitle>
                </CardHeader>
                {expandedSections.care && (
                    <CardContent className="pt-0">
                        <div className="space-y-4">
                            {/* Nutrition */}
                            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-xl">
                                <h5 className="font-semibold flex items-center gap-2 mb-2">
                                    <Utensils className="w-4 h-4 text-green-600" />
                                    🍽️ Dinh dưỡng
                                </h5>
                                <div className="flex items-center gap-4 mb-2">
                                    <Badge variant="outline" className="border-green-300 text-green-700">
                                        {data?.care_guide?.nutrition?.meals_per_day} bữa/ngày
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                        {data?.care_guide?.nutrition?.food_type}
                                    </span>
                                </div>
                                <ul className="space-y-1">
                                    {(data?.care_guide?.nutrition?.tips || []).map((tip, idx) => (
                                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                            <span className="text-green-500">✓</span> {tip}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Medical */}
                            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl">
                                <h5 className="font-semibold flex items-center gap-2 mb-2">
                                    <Syringe className="w-4 h-4 text-blue-600" />
                                    💉 Y tế & Vaccine
                                </h5>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {(data?.care_guide?.medical?.vaccines || []).map((vaccine, idx) => (
                                        <Badge key={idx} variant="outline" className="border-blue-300 text-blue-700">
                                            {vaccine}
                                        </Badge>
                                    ))}
                                </div>
                                <ul className="space-y-1">
                                    {(data?.care_guide?.medical?.notes || []).map((note, idx) => (
                                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                            <span className="text-blue-500">📌</span> {note}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Training */}
                            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl">
                                <h5 className="font-semibold flex items-center gap-2 mb-2">
                                    <GraduationCap className="w-4 h-4 text-amber-600" />
                                    🎓 Huấn luyện
                                </h5>
                                <div className="mb-2">
                                    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                                        📢 Lệnh nên dạy: {data?.care_guide?.training?.command}
                                    </Badge>
                                </div>
                                <ul className="space-y-1">
                                    {(data?.care_guide?.training?.tips || []).map((tip, idx) => (
                                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                            <span className="text-amber-500">💡</span> {tip}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* Section 4: Warnings */}
            <Card className="overflow-hidden border-red-200">
                <CardHeader
                    className="pb-2 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleSection("warnings")}
                >
                    <CardTitle className="flex items-center justify-between text-base">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                                <Shield className="w-4 h-4 text-red-600" />
                            </div>
                            <span>⚠️ Cảnh báo & Lưu ý</span>
                        </div>
                        {expandedSections.warnings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </CardTitle>
                </CardHeader>
                {expandedSections.warnings && (
                    <CardContent className="pt-0">
                        <div className="space-y-4">
                            {/* Genetic Diseases */}
                            {(data?.warnings?.genetic_diseases || []).length > 0 && (
                                <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-xl">
                                    <h5 className="font-semibold text-sm text-red-700 flex items-center gap-2 mb-2">
                                        <AlertTriangle className="w-4 h-4" />
                                        🧬 Bệnh di truyền thường gặp
                                    </h5>
                                    <div className="flex flex-wrap gap-2">
                                        {(data?.warnings?.genetic_diseases || []).map((disease, idx) => (
                                            <Badge key={idx} variant="outline" className="border-red-300 text-red-700">
                                                {disease}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Dangerous Foods */}
                            {(data?.warnings?.dangerous_foods || []).length > 0 && (
                                <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-xl">
                                    <h5 className="font-semibold text-sm text-orange-700 flex items-center gap-2 mb-2">
                                        🚫 Thực phẩm nguy hiểm
                                    </h5>
                                    <div className="flex flex-wrap gap-2">
                                        {(data?.warnings?.dangerous_foods || []).map((food, idx) => (
                                            <Badge key={idx} className="bg-orange-100 text-orange-800">
                                                ❌ {food}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Environment Hazards */}
                            {(data?.warnings?.environment_hazards || []).length > 0 && (
                                <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-xl">
                                    <h5 className="font-semibold text-sm text-yellow-700 flex items-center gap-2 mb-2">
                                        🏠 Môi trường cần tránh
                                    </h5>
                                    <ul className="space-y-1">
                                        {(data?.warnings?.environment_hazards || []).map((hazard, idx) => (
                                            <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                                <span className="text-yellow-600">⚠️</span> {hazard}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </CardContent>
                )}
            </Card>
        </div>
    )
}
