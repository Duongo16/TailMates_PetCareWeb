"use client"

import { useState } from "react"
import { useServices, useBookings, usePets } from "@/lib/hooks"
import { bookingsAPI } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, Star, Sparkles, Search, ChevronLeft, ChevronRight, CheckCircle2, Loader2, MapPin } from "lucide-react"
import Image from "next/image"

export function ServiceBooking() {
  const { data: servicesData, isLoading: servicesLoading } = useServices()
  const { data: bookings, refetch: refetchBookings, isLoading: bookingsLoading } = useBookings()
  const { data: pets, isLoading: petsLoading } = usePets()

  const [selectedService, setSelectedService] = useState<any | null>(null)
  const [bookingStep, setBookingStep] = useState(1)
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [selectedPet, setSelectedPet] = useState("")
  const [notes, setNotes] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const services = servicesData?.services || []

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  // Generate categories from available services (assuming category is missing in schema, we might mock or use a field if added. 
  // Looking at schema, Service model doesn't have explicit category enum, but maybe we can just list "Spa", "Medical", etc based on names or added field. 
  // Let's assume all for now or mock standard categories if needed. Schema showed "name", "price_min", etc.)
  const categories = ["all", "Spa & Grooming", "Y tế", "Huấn luyện"] // Mock categories for now

  const filteredServices = services.filter((service: any) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (service.description || "").toLowerCase().includes(searchTerm.toLowerCase())
    // Basic category filtering based on name keywords if category field missing
    let matchesCategory = true;
    if (filterCategory !== "all") {
       if (filterCategory === "Y tế") matchesCategory = service.name.toLowerCase().includes("khám") || service.name.toLowerCase().includes("tiêm");
       else if (filterCategory === "Spa & Grooming") matchesCategory = service.name.toLowerCase().includes("tắm") || service.name.toLowerCase().includes("cắt");
       else matchesCategory = true; 
    }
    
    return matchesSearch && matchesCategory
  })

  // Dynamic available times generation (09:00 - 18:00)
  const availableTimes = Array.from({ length: 10 }, (_, i) => {
    const hour = i + 9
    return `${hour.toString().padStart(2, '0')}:00`
  }) 

  const handleBooking = async () => {
    if (!selectedService || !selectedPet || !selectedDate || !selectedTime) return

    setIsSubmitting(true)
    try {
      // Create date object from selected date and time
      // selectedDate format: "dd/mm/yyyy" (from generateDates)
      const [day, month, year] = selectedDate.split("/").map(Number)
      const [hours, minutes] = selectedTime.split(":").map(Number)
      const bookingDate = new Date(year, month - 1, day, hours, minutes)

      const response = await bookingsAPI.create({
        service_id: selectedService._id,
        pet_id: selectedPet,
        booking_time: bookingDate.toISOString(),
        note: notes
      })

      if (response.success) {
        setBookingSuccess(true)
        refetchBookings()
        setTimeout(() => {
          setSelectedService(null)
          setBookingStep(1)
          setBookingSuccess(false)
          setSelectedDate("")
          setSelectedTime("")
          setNotes("")
          setIsSubmitting(false)
        }, 2000)
      } else {
        alert(response.message || "Đặt lịch thất bại")
        setIsSubmitting(false)
      }
    } catch (error) {
      alert("Lỗi kết nối")
      setIsSubmitting(false)
    }
  }

  const generateDates = () => {
    const dates = []
    const today = new Date()
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      dates.push({
        full: date.toLocaleDateString("vi-VN"), // dd/mm/yyyy
        day: date.getDate(),
        weekday: date.toLocaleDateString("vi-VN", { weekday: "short" }),
        month: date.toLocaleDateString("vi-VN", { month: "short" }),
      })
    }
    return dates
  }

  const dates = generateDates()

  if (servicesLoading || bookingsLoading || petsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Đặt lịch dịch vụ</h1>
        <p className="text-foreground/60">Chọn dịch vụ phù hợp cho bé cưng của bạn</p>
      </div>

      <Tabs defaultValue="services" className="w-full">
        <TabsList className="w-full bg-card rounded-xl p-1">
          <TabsTrigger
            value="services"
            className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Dịch vụ
          </TabsTrigger>
          <TabsTrigger
            value="bookings"
            className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Lịch hẹn của tôi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="mt-4 space-y-4">
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
              <Input
                placeholder="Tìm kiếm dịch vụ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={filterCategory === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterCategory(cat)}
                  className="rounded-full whitespace-nowrap bg-transparent data-[state=active]:bg-primary"
                >
                  {cat === "all" ? "Tất cả" : cat}
                </Button>
              ))}
            </div>
          </div>

          {/* AI Recommendations */}
          {pets && pets.length > 0 && (
            <Card className="bg-gradient-to-r from-secondary to-muted border-none">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span className="font-bold text-foreground">AI Đề xuất cho {pets[0].name}</span>
                </div>
                <p className="text-sm text-foreground/70">
                  Dựa trên độ tuổi và tình trạng sức khỏe, chúng tôi đề xuất dịch vụ spa định kỳ và khám tổng quát mỗi 6
                  tháng.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Services Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredServices.map((service: any) => (
              <Card
                key={service._id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedService(service)}
              >
                <CardContent className="p-0">
                  <div className="flex">
                    <div className="relative w-32 h-32 flex-shrink-0 bg-secondary">
                      <Image
                        src={service.image?.url || "/placeholder.svg"}
                        alt={service.name}
                        fill
                        className="object-cover"
                      />
                      {service.aiMatch && (
                        <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground">
                          <Sparkles className="w-3 h-3 mr-1" />
                          AI
                        </Badge>
                      )}
                    </div>
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <h4 className="font-bold text-foreground">{service.name}</h4>
                          <p className="text-xs text-foreground/50">{service.merchant_id?.merchant_profile?.shop_name || "Merchant"}</p>
                        </div>
                      </div>
                      <p className="text-sm text-foreground/60 line-clamp-2 mb-2">{service.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-sm text-foreground/60">
                          <span className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-primary text-primary" />
                            {service.merchant_id?.merchant_profile?.rating || 5.0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {service.duration_minutes}p
                          </span>
                        </div>
                        <p className="font-bold text-primary">{formatPrice(service.price_min)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="bookings" className="mt-4 space-y-4">
          <h3 className="font-bold text-foreground">Lịch hẹn sắp tới</h3>
          {bookings && bookings.length > 0 ? (
            <div className="space-y-3">
              {bookings.map((booking: any) => (
                <Card key={booking._id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            booking.status === "CONFIRMED" ? "bg-green-100" : "bg-orange-100"
                          }`}
                        >
                          <Calendar
                            className={`w-6 h-6 ${
                              booking.status === "CONFIRMED" ? "text-green-600" : "text-orange-600"
                            }`}
                          />
                        </div>
                        <div>
                          <h4 className="font-bold text-foreground">{booking.service_id?.name || "Dịch vụ đã xóa"}</h4>
                          <p className="text-sm text-foreground/60">
                             {booking.service_id?.merchant_id?.merchant_profile?.shop_name || "Cửa hàng"}
                          </p>
                          <p className="text-sm text-foreground/70">Cho bé: {booking.pet_id?.name || "Thú cưng"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          className={
                            booking.status === "CONFIRMED"
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700"
                          }
                        >
                          {booking.status === "CONFIRMED" 
                             ? "Đã xác nhận" 
                             : booking.status === "COMPLETED" 
                               ? "Hoàn thành" 
                               : booking.status === "CANCELLED"
                                 ? "Đã hủy"
                                 : "Chờ xác nhận"}
                        </Badge>
                        <p className="font-bold text-foreground mt-1">
                           {new Date(booking.booking_time).toLocaleTimeString("vi-VN", {hour: '2-digit', minute:'2-digit'})}
                        </p>
                        <p className="text-sm text-foreground/50">
                           {new Date(booking.booking_time).toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-secondary/30">
              <CardContent className="p-8 text-center">
                <Calendar className="w-12 h-12 text-foreground/30 mx-auto mb-3" />
                <p className="text-foreground/60">Bạn chưa có lịch hẹn nào</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Booking Modal */}
      <Dialog
        open={!!selectedService}
        onOpenChange={(open) => {
           if(!open) {
            setSelectedService(null)
            setBookingStep(1)
            setBookingSuccess(false)
           }
        }}
      >
        <DialogContent className="max-w-lg rounded-3xl max-h-[90vh] overflow-y-auto">
          {bookingSuccess ? (
            <div className="py-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Đặt lịch thành công!</h3>
              <p className="text-foreground/60">Chúng tôi sẽ liên hệ xác nhận sớm nhất</p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {bookingStep > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setBookingStep(bookingStep - 1)}
                      className="rounded-full"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                  )}
                  <span>Đặt lịch - Bước {bookingStep}/3</span>
                </DialogTitle>
              </DialogHeader>

              {selectedService && (
                <div className="space-y-4">
                  {/* Service Info */}
                  <Card className="bg-secondary/30">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-secondary">
                          <Image
                            src={selectedService.image?.url || "/placeholder.svg"}
                            alt={selectedService.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-foreground">{selectedService.name}</h4>
                          <p className="text-sm text-foreground/60">{selectedService.merchant_id?.merchant_profile?.shop_name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-bold text-primary">{formatPrice(selectedService.price_min)}</span>
                            <span className="text-sm text-foreground/50">• {selectedService.duration_minutes} phút</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Step 1: Select Pet & Date */}
                  {bookingStep === 1 && (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-foreground font-medium">Chọn thú cưng</Label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {pets?.map((pet) => (
                              <button
                                key={pet._id}
                                onClick={() => setSelectedPet(pet._id)}
                                className={`p-3 rounded-xl border-2 transition-all ${
                                  selectedPet === pet._id
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/50"
                                }`}
                              >
                                <div className="w-12 h-12 rounded-full overflow-hidden mx-auto mb-2 bg-secondary">
                                  <Image
                                    src={pet.image?.url || "/placeholder.svg"}
                                    alt={pet.name}
                                    width={48}
                                    height={48}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <p className="text-sm font-medium text-foreground">{pet.name}</p>
                                <p className="text-xs text-foreground/50">{pet.species}</p>
                              </button>
                            ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-foreground font-medium">Chọn ngày</Label>
                        <div className="flex gap-2 overflow-x-auto mt-2 pb-2">
                          {dates.slice(0, 7).map((date) => (
                            <button
                              key={date.full}
                              onClick={() => setSelectedDate(date.full)}
                              className={`flex-shrink-0 w-16 p-2 rounded-xl border-2 transition-all ${
                                selectedDate === date.full
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border hover:border-primary/50"
                              }`}
                            >
                              <p className="text-xs opacity-70">{date.weekday}</p>
                              <p className="text-lg font-bold">{date.day}</p>
                              <p className="text-xs opacity-70">{date.month}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      <Button
                        onClick={() => setBookingStep(2)}
                        disabled={!selectedPet || !selectedDate}
                        className="w-full rounded-xl py-6"
                      >
                        Tiếp tục
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  )}

                  {/* Step 2: Select Time */}
                  {bookingStep === 2 && (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-foreground font-medium">Chọn giờ</Label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {availableTimes.map((time) => (
                            <button
                              key={time}
                              onClick={() => setSelectedTime(time)}
                              className={`p-3 rounded-xl border-2 transition-all ${
                                selectedTime === time
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border hover:border-primary/50"
                              }`}
                            >
                              <Clock className="w-4 h-4 mx-auto mb-1" />
                              <p className="font-medium">{time}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-foreground font-medium">Ghi chú (không bắt buộc)</Label>
                        <Textarea
                          placeholder="VD: Bé hay sợ nước, cần nhẹ nhàng..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="mt-2 rounded-xl"
                          rows={3}
                        />
                      </div>

                      <Button
                        onClick={() => setBookingStep(3)}
                        disabled={!selectedTime}
                        className="w-full rounded-xl py-6"
                      >
                        Xem lại đặt lịch
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  )}

                  {/* Step 3: Confirm */}
                  {bookingStep === 3 && (
                    <div className="space-y-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Thông tin đặt lịch</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex justify-between py-2 border-b border-border">
                            <span className="text-foreground/60">Dịch vụ</span>
                            <span className="font-medium text-foreground">{selectedService.name}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-border">
                            <span className="text-foreground/60">Thú cưng</span>
                            <span className="font-medium text-foreground">
                              {pets?.find((p) => p._id === selectedPet)?.name}
                            </span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-border">
                            <span className="text-foreground/60">Thời gian</span>
                            <span className="font-medium text-foreground">{selectedTime} - {selectedDate}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-border">
                            <span className="text-foreground/60">Địa điểm</span>
                            <span className="font-medium text-foreground flex items-center gap-1">
                               <MapPin className="w-3 h-3" />
                               {selectedService.merchant_id?.merchant_profile?.shop_name}
                            </span>
                          </div>
                          {notes && (
                            <div className="py-2">
                              <span className="text-foreground/60 block mb-1">Ghi chú</span>
                              <span className="text-foreground">{notes}</span>
                            </div>
                          )}
                          <div className="flex justify-between py-2 pt-4 border-t border-border">
                            <span className="font-bold text-foreground">Tổng cộng</span>
                            <span className="font-bold text-primary text-lg">{formatPrice(selectedService.price_min)}</span>
                          </div>
                        </CardContent>
                      </Card>

                      <Button
                        onClick={handleBooking}
                        disabled={isSubmitting}
                        className="w-full rounded-xl py-6 bg-green-600 hover:bg-green-700"
                      >
                         {isSubmitting ? (
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5 mr-2" />
                        )}
                        Xác nhận đặt lịch
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
