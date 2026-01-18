"use client"

import { useState, useEffect } from "react"
import { useDashboardData } from "@/lib/hooks"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  CheckCircle2,
  Calendar,
  ShoppingBag,
  Bell,
  Heart,
  TrendingUp,
  Clock,
  Star,
  Loader2,
  Zap,
} from "lucide-react"
import Image from "next/image"
import { aiAPI } from "@/lib/api"
import { BannerCarousel } from "@/components/ui/banner-carousel"

interface CustomerDashboardProps {
  onPetSelect: (petId: string) => void
  onTabChange?: (tab: string) => void
}

const healthQuestions = [
  { id: "eating", label: "Bé có ăn uống bình thường không?" },
  { id: "active", label: "Bé có hoạt động năng động không?" },
  { id: "poop", label: "Phân của bé có bình thường không?" },
  { id: "sleep", label: "Bé có ngủ đủ giấc không?" },
  { id: "temp", label: "Nhiệt độ cơ thể có bình thường không?" },
]



export function CustomerDashboard({ onPetSelect, onTabChange }: CustomerDashboardProps) {
  const { user } = useAuth()
  // Parallel fetch - loads all data simultaneously for faster performance
  const { pets, bookings, orders, isLoading: petsLoading } = useDashboardData()

  const [magicModalOpen, setMagicModalOpen] = useState(false)
  const [checklist, setChecklist] = useState<Record<string, boolean>>({})
  const [showResult, setShowResult] = useState(false)
  const [currentPetIndex, setCurrentPetIndex] = useState(0)
  const [aiSymptoms, setAiSymptoms] = useState("")
  const [aiResponse, setAiResponse] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  const handleChecklistChange = (id: string, checked: boolean) => {
    setChecklist((prev) => ({ ...prev, [id]: checked }))
  }

  const handleSubmitChecklist = async () => {
    if (!pets || pets.length === 0) return

    setAiLoading(true)
    const currentPet = pets[currentPetIndex]

    // Build symptoms from checklist
    const symptoms = Object.entries(checklist)
      .filter(([_, checked]) => !checked)
      .map(([id]) => {
        const q = healthQuestions.find(q => q.id === id)
        return q ? `Không: ${q.label}` : ""
      })
      .filter(Boolean)
      .join(". ")

    const symptomsText = symptoms || aiSymptoms || "Kiểm tra sức khỏe định kỳ"

    try {
      const response = await aiAPI.consultation(currentPet._id, symptomsText)
      if (response.success && response.data) {
        setAiResponse(response.data.ai_advice)
      } else {
        setAiResponse("Không thể nhận được phản hồi từ AI. Vui lòng thử lại.")
      }
    } catch (error) {
      setAiResponse("Lỗi kết nối. Vui lòng thử lại sau.")
    } finally {
      setAiLoading(false)
      setShowResult(true)
    }
  }

  const resetModal = () => {
    setChecklist({})
    setShowResult(false)
    setMagicModalOpen(false)
    setAiSymptoms("")
    setAiResponse(null)
  }

  const healthScore = Object.values(checklist).filter(Boolean).length
  const isHealthy = healthScore >= 4

  const nextPet = () => {
    if (pets) {
      setCurrentPetIndex((prev) => (prev + 1) % pets.length)
    }
  }

  const prevPet = () => {
    if (pets) {
      setCurrentPetIndex((prev) => (prev - 1 + pets.length) % pets.length)
    }
  }

  const currentTime = new Date().getHours()
  const greeting = currentTime < 12 ? "Chào buổi sáng" : currentTime < 18 ? "Chào buổi chiều" : "Chào buổi tối"

  // Helper to format pet age
  const formatAge = (ageMonths: number) => {
    if (ageMonths >= 12) {
      const years = Math.floor(ageMonths / 12)
      const months = ageMonths % 12
      return months > 0 ? `${years} tuổi ${months} tháng` : `${years} tuổi`
    }
    return `${ageMonths} tháng`
  }

  // Helper to get species display name
  const getSpeciesName = (species: string) => {
    const speciesMap: Record<string, string> = {
      Cat: "Mèo",
      Dog: "Chó",
      Rabbit: "Thỏ",
      Hamster: "Hamster",
      Bird: "Chim",
    }
    return speciesMap[species] || species
  }

  const pendingBookings = bookings?.filter(b => b.status === "PENDING" || b.status === "CONFIRMED").length || 0
  const completedOrders = orders?.filter(o => o.status === "COMPLETED").length || 0

  return (
    <div className="space-y-4">
      {/* Greeting Section with Magic Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center overflow-hidden shadow-lg shadow-primary/25">
              <Image
                src={user?.avatar || "/cute-girl-avatar-with-cat-ears-anime-style.jpg"}
                alt="Avatar"
                width={56}
                height={56}
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-card" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-foreground">
              {greeting}, {user?.name?.split(" ").pop() || "bạn"}!
            </h1>
            <p className="text-foreground/60 text-sm">Hôm nay bé cưng của bạn thế nào?</p>
          </div>
        </div>
        {/* Magic Button - Compact Version */}
        <Button
          onClick={() => setMagicModalOpen(true)}
          className="magic-button bg-gradient-to-r from-primary via-primary/90 to-accent text-white hover:opacity-90 font-bold px-4 py-5 rounded-2xl text-sm shadow-xl hover:scale-105 transition-transform hidden sm:flex"
          disabled={!pets || pets.length === 0}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Nút Diệu Kỳ
        </Button>
      </div>

      {/* Banner Carousel */}
      <BannerCarousel location="HOME" />

      {/* Main Content - Compact Grid Layout for Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:flex-1" style={{ minHeight: 'auto', maxHeight: 'calc(100vh - 280px)' }}>

        {/* Left Column - Pet Cards (spans 2 columns) */}
        <div className="lg:col-span-2 lg:row-span-2 lg:max-h-full lg:overflow-hidden">
          <Card className="h-full">
            <CardContent className="p-3 h-full flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary" />
                  Thú cưng của bạn
                </h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={prevPet}
                    className="rounded-full bg-transparent w-7 h-7"
                    disabled={!pets || pets.length <= 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-foreground/60">
                    {pets ? `${currentPetIndex + 1}/${pets.length}` : "0/0"}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={nextPet}
                    className="rounded-full bg-transparent w-7 h-7"
                    disabled={!pets || pets.length <= 1}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {petsLoading ? (
                <div className="flex items-center justify-center flex-1">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="flex gap-3 overflow-x-auto p-2 pb-4 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                  {pets?.map((pet, index) => (
                    <div
                      key={pet._id}
                      onClick={() => onPetSelect(pet._id)}
                      className={`relative cursor-pointer transition-all duration-300 flex-shrink-0 w-[160px] sm:w-[180px] lg:w-[200px] ${index === currentPetIndex
                        ? "scale-[1.02]"
                        : "hover:scale-[1.01]"
                        }`}
                    >
                      {/* Animated border for selected pet */}
                      {index === currentPetIndex && (
                        <div className="absolute -inset-[3px] rounded-xl bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-gradient-x z-0" />
                      )}

                      <Card
                        className={`relative z-10 h-full transition-all duration-300 ${index === currentPetIndex
                          ? "shadow-xl shadow-primary/30 bg-card"
                          : "card-hover"
                          }`}
                      >
                        {/* Glow effect for selected */}
                        {index === currentPetIndex && (
                          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
                        )}

                        <CardContent className="p-2 relative">
                          <div className="relative aspect-[4/3] rounded-lg overflow-hidden mb-2 bg-secondary">
                            <Image
                              src={pet.image?.url || "/placeholder.svg"}
                              alt={pet.name}
                              width={200}
                              height={150}
                              className={`w-full h-full object-cover transition-transform duration-500 ${index === currentPetIndex ? "scale-105" : ""
                                }`}
                            />

                            {/* Selected indicator with pulse */}
                            {index === currentPetIndex && (
                              <div className="absolute top-1 left-1">
                                <div className="relative">
                                  <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-75" />
                                  <div className="relative w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                    <Heart className="w-2 h-2 text-white fill-white" />
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="absolute top-1 right-1">
                              <Badge className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 leading-tight">Khỏe</Badge>
                            </div>
                          </div>

                          <div className="leading-tight mt-1">
                            <div className="flex items-center justify-between gap-1">
                              <h3 className={`font-bold text-sm transition-colors truncate ${index === currentPetIndex ? "text-primary" : "text-foreground"
                                }`}>
                                {pet.name}
                              </h3>
                              <span className="text-xs text-foreground/50">
                                {pet.gender === "male" ? "♂" : pet.gender === "female" ? "♀" : ""}
                              </span>
                            </div>
                            <p className="text-foreground/70 text-xs truncate font-medium">
                              {getSpeciesName(pet.species)} {pet.breed ? `• ${pet.breed}` : ""}
                            </p>
                            <p className="text-foreground/50 text-xs truncate">
                              {formatAge(pet.age_months)} • {pet.weight ? `${pet.weight}kg` : "Chưa cập nhật"}
                            </p>
                          </div>

                          {/* Bottom accent bar for selected */}
                          {index === currentPetIndex && (
                            <div className="absolute bottom-0 left-1.5 right-1.5 h-0.5 bg-gradient-to-r from-primary via-accent to-primary rounded-full animate-pulse" />
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  ))}

                  {/* Add Pet Card */}
                  <Card
                    onClick={() => onTabChange?.("pets")}
                    className="cursor-pointer transition-all duration-300 border-dashed border-2 hover:border-primary hover:bg-primary/5 flex-shrink-0 w-[160px] sm:w-[180px] lg:w-[200px]"
                  >
                    <CardContent className="p-2 h-full flex flex-col items-center justify-center text-foreground/40 hover:text-primary aspect-[4/3]">
                      <div className="w-6 h-6 rounded-full border-2 border-dashed border-current flex items-center justify-center mb-0.5">
                        <span className="text-sm">+</span>
                      </div>
                      <p className="font-medium text-[9px]">Thêm mới</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Top - Quick Actions */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardContent className="p-3 h-full flex flex-col">
              <h3 className="font-bold text-foreground mb-3 flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-accent" />
                Thao tác nhanh
              </h3>
              <div className="grid grid-cols-3 gap-1.5 flex-1">
                {[
                  {
                    icon: Calendar,
                    label: "Đặt lịch",
                    color: "bg-[#2B3A98]",
                    tab: "booking",
                    count: bookings?.filter((b: any) => ["PENDING", "CONFIRMED"].includes(b.status)).length || 0
                  },
                  {
                    icon: ShoppingBag,
                    label: "Mua sắm",
                    color: "bg-[#F16A3F]",
                    tab: "marketplace",
                    count: orders?.filter((o: any) => ["PENDING", "PROCESSING"].includes(o.status)).length || 0
                  },
                  {
                    icon: Bell,
                    label: "Nhắc nhở",
                    color: "bg-green-600",
                    tab: "medical",
                    count: (bookings?.filter((b: any) => ["PENDING", "CONFIRMED"].includes(b.status)).length || 0) + (orders?.filter((o: any) => ["PENDING", "PROCESSING"].includes(o.status)).length || 0)
                  },
                ].map((action, index) => (
                  <div
                    key={index}
                    onClick={() => onTabChange?.(action.tab)}
                    className="card-hover cursor-pointer group text-center p-2 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors h-full flex flex-col items-center justify-center relative"
                  >
                    {!!action.count && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg">
                        {action.count}
                      </span>
                    )}
                    <div
                      className={`w-10 h-10 ${action.color} rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform shadow-lg`}
                    >
                      <action.icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-xs font-medium text-foreground">{action.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Bottom - Overview Stats */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardContent className="p-3 h-full flex flex-col">
              <h3 className="font-bold text-foreground mb-3 flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-primary" />
                Tổng quan
              </h3>
              <div className="grid grid-cols-2 gap-1.5 flex-1">
                <div className="bg-secondary/50 rounded-xl p-2 text-center flex flex-col justify-center">
                  <p className="text-lg font-bold text-foreground">{pets?.length || 0}</p>
                  <p className="text-foreground/60 text-xs">Thú cưng</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-2 text-center flex flex-col justify-center">
                  <p className="text-lg font-bold text-foreground">{pendingBookings}</p>
                  <p className="text-foreground/60 text-xs">Lịch hẹn</p>
                </div>
                <div className="bg-green-50 rounded-xl p-2 text-center flex flex-col justify-center">
                  <p className="text-lg font-bold text-green-600">{completedOrders}</p>
                  <p className="text-foreground/60 text-xs">Đơn hàng</p>
                </div>
                <div className="bg-primary/10 rounded-xl p-2 text-center flex flex-col justify-center">
                  <p className="text-lg font-bold text-primary">
                    {user?.subscription?.features?.length ? "PRO" : "FREE"}
                  </p>
                  <p className="text-foreground/60 text-xs">Gói thành viên</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Magic Modal */}
      <Dialog open={magicModalOpen} onOpenChange={resetModal}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              {showResult ? "Kết quả AI" : "Kiểm tra sức khỏe"}
            </DialogTitle>
            <DialogDescription>
              {showResult
                ? `Phân tích sức khỏe cho ${pets?.[currentPetIndex]?.name || "thú cưng"}`
                : "Trả lời các câu hỏi về thú cưng của bạn"
              }
            </DialogDescription>
          </DialogHeader>

          {!showResult ? (
            <div className="space-y-4">
              {healthQuestions.map((q, index) => (
                <div
                  key={q.id}
                  className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => handleChecklistChange(q.id, !checklist[q.id])}
                >
                  <Checkbox
                    id={q.id}
                    checked={checklist[q.id] || false}
                    onCheckedChange={(checked) => handleChecklistChange(q.id, checked as boolean)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <label htmlFor={q.id} className="text-foreground cursor-pointer flex-1">
                    {q.label}
                  </label>
                </div>
              ))}

              <Textarea
                placeholder="Mô tả thêm triệu chứng (nếu có)..."
                value={aiSymptoms}
                onChange={(e) => setAiSymptoms(e.target.value)}
                className="min-h-[80px]"
              />

              <Button
                onClick={handleSubmitChecklist}
                className="w-full rounded-xl py-6 font-bold shadow-lg shadow-primary/25"
                disabled={aiLoading}
              >
                {aiLoading ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5 mr-2" />
                )}
                {aiLoading ? "Đang phân tích..." : "Xem kết quả AI"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in-up">
              <Card
                className={`border-2 ${isHealthy ? "border-green-400 bg-green-50" : "border-primary bg-primary/10"}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    {isHealthy ? (
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-primary" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-foreground text-lg">
                        {isHealthy ? "Bé khỏe mạnh!" : "Cần chú ý!"}
                      </h3>
                      <p className="text-sm text-foreground/60">Điểm sức khỏe: {healthScore}/5</p>
                    </div>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${isHealthy ? "bg-green-500" : "bg-primary"}`}
                      style={{ width: `${(healthScore / 5) * 100}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-secondary/50">
                <CardContent className="p-4">
                  <h4 className="font-bold text-foreground mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Lời khuyên từ AI
                  </h4>
                  <div className="text-foreground/80 text-sm leading-relaxed whitespace-pre-wrap">
                    {aiResponse || "Đang tải..."}
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button onClick={resetModal} variant="outline" className="flex-1 rounded-xl py-6 bg-transparent">
                  Đóng
                </Button>
                <Button className="flex-1 rounded-xl py-6">
                  <Calendar className="w-4 h-4 mr-2" />
                  Đặt lịch khám
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
