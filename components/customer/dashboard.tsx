"use client"

import { useState, useEffect } from "react"
import { usePets, useBookings, useOrders } from "@/lib/hooks"
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
} from "lucide-react"
import Image from "next/image"
import { aiAPI } from "@/lib/api"

interface CustomerDashboardProps {
  onPetSelect: (petId: string) => void
}

const healthQuestions = [
  { id: "eating", label: "Bé có ăn uống bình thường không?" },
  { id: "active", label: "Bé có hoạt động năng động không?" },
  { id: "poop", label: "Phân của bé có bình thường không?" },
  { id: "sleep", label: "Bé có ngủ đủ giấc không?" },
  { id: "temp", label: "Nhiệt độ cơ thể có bình thường không?" },
]



export function CustomerDashboard({ onPetSelect }: CustomerDashboardProps) {
  const { user } = useAuth()
  const { data: pets, isLoading: petsLoading } = usePets()
  const { data: bookings } = useBookings()
  const { data: orders } = useOrders()

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
    <div className="space-y-6">
      {/* Greeting Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center overflow-hidden shadow-lg shadow-primary/25">
              <Image 
                src={user?.avatar || "/cute-girl-avatar-with-cat-ears-anime-style.jpg"} 
                alt="Avatar" 
                width={64} 
                height={64} 
                className="object-cover" 
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-card" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              {greeting}, {user?.name?.split(" ").pop() || "bạn"}!
            </h1>
            <p className="text-foreground/60">Hôm nay bé cưng của bạn thế nào?</p>
          </div>
        </div>
        <Button variant="outline" className="rounded-xl bg-transparent hidden sm:flex">
          <Bell className="w-4 h-4 mr-2" />
          <span className="relative">
            Thông báo
            {pendingBookings > 0 && (
              <span className="absolute -top-1 -right-4 w-4 h-4 bg-primary text-white text-xs rounded-full flex items-center justify-center">
                {pendingBookings}
              </span>
            )}
          </span>
        </Button>
      </div>

      {/* Magic Button */}
      <Card className="bg-gradient-to-r from-primary via-primary/90 to-accent border-none overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
        <CardContent className="p-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="flex-1 text-white">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold">Nút Diệu Kỳ</h2>
              </div>
              <p className="text-white/80 text-sm max-w-md">
                Kiểm tra sức khỏe thú cưng chỉ trong 30 giây với AI thông minh. Phát hiện sớm các vấn đề tiềm ẩn.
              </p>
            </div>
            <Button
              onClick={() => setMagicModalOpen(true)}
              className="magic-button bg-white text-primary hover:bg-white/90 font-bold px-8 py-6 rounded-2xl text-base shadow-xl hover:scale-105 transition-transform"
              disabled={!pets || pets.length === 0}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Kiểm tra ngay
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { 
            icon: Calendar, 
            label: "Đặt lịch", 
            color: "bg-accent", 
            count: bookings?.filter((b: any) => ["PENDING", "CONFIRMED"].includes(b.status)).length || 0 
          },
          { 
            icon: ShoppingBag, 
            label: "Mua sắm", 
            color: "bg-green-500", 
            count: orders?.filter((o: any) => ["PENDING", "PROCESSING"].includes(o.status)).length || 0 
          },
          { 
            icon: Bell, 
            label: "Nhắc nhở", 
            color: "bg-purple-500", 
            count: (bookings?.filter((b: any) => ["PENDING", "CONFIRMED"].includes(b.status)).length || 0) + (orders?.filter((o: any) => ["PENDING", "PROCESSING"].includes(o.status)).length || 0) 
          },
          { 
            icon: Heart, 
            label: "Sức khỏe", 
            color: "bg-pink-500", 
            count: pets?.length || 0 
          },
        ].map((action, index) => (
          <Card key={index} className="card-hover cursor-pointer group">
            <CardContent className="p-4 text-center">
              <div
                className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform shadow-lg`}
              >
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-medium text-foreground">{action.label}</p>
              {!!action.count && (
                <Badge variant="secondary" className="mt-1 text-xs">
                  {action.count}
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pet Cards Carousel */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Thú cưng của bạn</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={prevPet}
              className="rounded-full bg-transparent w-8 h-8"
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
              className="rounded-full bg-transparent w-8 h-8"
              disabled={!pets || pets.length <= 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {petsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
            {pets?.map((pet, index) => (
              <Card
                key={pet._id}
                onClick={() => onPetSelect(pet._id)}
                className={`min-w-[240px] lg:max-w-[280px] cursor-pointer transition-all duration-300 snap-center card-hover ${
                  index === currentPetIndex ? "ring-2 ring-primary shadow-lg shadow-primary/20" : ""
                }`}
              >
                <CardContent className="p-4">
                  <div className="relative aspect-square rounded-2xl overflow-hidden mb-3 bg-secondary">
                    <Image
                      src={pet.image?.url || "/placeholder.svg"}
                      alt={pet.name}
                      width={240}
                      height={240}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-green-500 text-white text-xs">Khỏe mạnh</Badge>
                    </div>
                  </div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-foreground text-lg">{pet.name}</h3>
                      <p className="text-foreground/60 text-sm">
                        {getSpeciesName(pet.species)} • {pet.breed || "Không rõ giống"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-primary">
                      <Star className="w-4 h-4 fill-primary" />
                      <span className="text-sm font-medium">{formatAge(pet.age_months)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Add Pet Card */}
            <Card className="min-w-[240px] lg:min-w-[280px] cursor-pointer transition-all duration-300 snap-center border-dashed border-2 hover:border-primary hover:bg-primary/5">
              <CardContent className="p-4 h-full flex flex-col items-center justify-center text-foreground/40 hover:text-primary">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-current flex items-center justify-center mb-3">
                  <span className="text-3xl">+</span>
                </div>
                <p className="font-medium">Thêm thú cưng mới</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Stats & Reminders Row */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Quick Stats */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Tổng quan
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary/50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-foreground">{pets?.length || 0}</p>
                <p className="text-foreground/60 text-sm">Thú cưng</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-foreground">{pendingBookings}</p>
                <p className="text-foreground/60 text-sm">Lịch hẹn</p>
              </div>
              <div className="bg-green-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-green-600">{completedOrders}</p>
                <p className="text-foreground/60 text-sm">Đơn hàng</p>
              </div>
              <div className="bg-primary/10 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-primary">
                  {user?.subscription?.features?.length ? "PRO" : "FREE"}
                </p>
                <p className="text-foreground/60 text-sm">Gói thành viên</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Bookings */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-accent" />
              Lịch hẹn sắp tới
            </h3>
            <div className="space-y-3">
              {bookings && bookings.length > 0 ? (
                bookings.slice(0, 3).map((booking) => (
                  <div
                    key={booking._id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-accent/20">
                      <Calendar className="w-5 h-5 text-accent" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground text-sm">
                        {booking.service_id?.name || "Dịch vụ"}
                      </p>
                      <p className="text-foreground/60 text-xs">
                        {new Date(booking.booking_time).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                    <Badge variant={booking.status === "CONFIRMED" ? "default" : "secondary"}>
                      {booking.status === "CONFIRMED" ? "Đã xác nhận" : "Chờ duyệt"}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-foreground/60 text-sm text-center py-4">
                  Chưa có lịch hẹn nào
                </p>
              )}
            </div>
          </CardContent>
        </Card>
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
