"use client"

import { useState, useEffect, useMemo } from "react"
import { useServices, useBookings, usePets } from "@/lib/hooks"
import { bookingsAPI } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, Star, Search, ChevronLeft, ChevronRight, CheckCircle2, Loader2, MapPin, XCircle, Sparkles, Syringe, Bath, Stethoscope, Bug, Store } from "lucide-react"
import Image from "next/image"
import { AlertDialog, useAlertDialog } from "@/components/ui/alert-dialog-custom"
import { BannerCarousel } from "@/components/ui/banner-carousel"

// Status color mapping
const STATUS_COLORS = {
  PENDING: "bg-orange-500",
  CONFIRMED: "bg-green-500",
  COMPLETED: "bg-blue-500",
  CANCELLED: "bg-red-500",
}

const STATUS_LABELS = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
}

export function ServiceBooking() {
  const { data: servicesData, isLoading: servicesLoading } = useServices()
  const { data: bookings, refetch: refetchBookings, isLoading: bookingsLoading } = useBookings()
  const { data: pets, isLoading: petsLoading } = usePets()

  // Service selection & booking flow
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
  const [bookedSlots, setBookedSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const { alertState, showAlert, closeAlert } = useAlertDialog()

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<Date | null>(null)
  const [showDayAppointments, setShowDayAppointments] = useState(false)

  const services = servicesData?.services || []

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  const categories = ["all", "Spa & Grooming", "Y tế", "Huấn luyện"]

  const filteredServices = services.filter((service: any) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (service.description || "").toLowerCase().includes(searchTerm.toLowerCase())
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

  // Fetch booked slots when date, service, or pet changes
  useEffect(() => {
    async function fetchBookedSlots() {
      if (!selectedService || !selectedDate || !selectedPet) {
        setBookedSlots([])
        return
      }

      setLoadingSlots(true)
      try {
        // Pass petId to check for pet's existing bookings on this date
        const response = await bookingsAPI.getBookedSlots(selectedService._id, selectedDate, selectedPet)
        if (response.success && response.data) {
          setBookedSlots(response.data.booked_slots || [])
        }
      } catch (error) {
        console.error("Error fetching booked slots:", error)
      } finally {
        setLoadingSlots(false)
      }
    }

    fetchBookedSlots()
  }, [selectedService, selectedDate, selectedPet])

  const handleBooking = async () => {
    if (!selectedService || !selectedPet || !selectedDate || !selectedTime) return

    setIsSubmitting(true)
    try {
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
          setBookedSlots([])
          setIsSubmitting(false)
        }, 2000)
      } else {
        showAlert({
          type: "error",
          title: "Đặt lịch thất bại",
          message: response.message || "Không thể đặt lịch. Vui lòng thử lại.",
        })
        setIsSubmitting(false)
      }
    } catch (error) {
      showAlert({
        type: "error",
        title: "Lỗi kết nối",
        message: "Không thể kết nối đến máy chủ. Vui lòng thử lại.",
      })
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
        full: date.toLocaleDateString("vi-VN"),
        day: date.getDate(),
        weekday: date.toLocaleDateString("vi-VN", { weekday: "short" }),
        month: date.toLocaleDateString("vi-VN", { month: "short" }),
      })
    }
    return dates
  }

  const dates = generateDates()

  // Calendar helpers - Get bookings grouped by status for each date
  const getBookingsByStatusForDate = useMemo(() => {
    const statusMap = new Map<string, { status: string; count: number }[]>()
    bookings?.forEach((booking: any) => {
      const dateKey = new Date(booking.booking_time).toDateString()
      if (!statusMap.has(dateKey)) {
        statusMap.set(dateKey, [])
      }
      const statusArray = statusMap.get(dateKey)!
      const existingStatus = statusArray.find(s => s.status === booking.status)
      if (existingStatus) {
        existingStatus.count++
      } else {
        statusArray.push({ status: booking.status, count: 1 })
      }
    })
    return statusMap
  }, [bookings])

  const getBookingsForDate = (date: Date) => {
    return bookings?.filter((booking: any) => {
      const bookingDate = new Date(booking.booking_time)
      return bookingDate.toDateString() === date.toDateString()
    }) || []
  }

  // Generate calendar days for current month
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    const startDayOfWeek = firstDay.getDay() // 0 = Sunday
    const daysInMonth = lastDay.getDate()

    const days: (Date | null)[] = []

    // Add empty slots for days before the first day of month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null)
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const calendarDays = generateCalendarDays()
  const weekdays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]

  // Month/Year options
  const months = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ]

  const currentYear = new Date().getFullYear()
  const years = [currentYear - 1, currentYear, currentYear + 1]

  const handleMonthChange = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const handleDayClick = (day: Date) => {
    const bookingsOnDay = getBookingsForDate(day)
    if (bookingsOnDay.length > 0) {
      setSelectedCalendarDay(day)
      setShowDayAppointments(true)
    }
  }

  if (servicesLoading || bookingsLoading || petsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Banner - Full Width */}
      <BannerCarousel location="SERVICE" />

      {/* Main Grid Layout - 60/40 split on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4">

        {/* Column 1 (60%): Calendar - Compact size */}
        <Card>
          <CardContent className="p-4">
            {/* Month/Year Selector - Compact */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <p className="font-bold text-base text-foreground">
                {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </p>
              <div className="flex items-center gap-1">
                <Select
                  value={currentMonth.getMonth().toString()}
                  onValueChange={(value) => {
                    const newDate = new Date(currentMonth)
                    newDate.setMonth(parseInt(value))
                    setCurrentMonth(newDate)
                  }}
                >
                  <SelectTrigger className="w-24 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={currentMonth.getFullYear().toString()}
                  onValueChange={(value) => {
                    const newDate = new Date(currentMonth)
                    newDate.setFullYear(parseInt(value))
                    setCurrentMonth(newDate)
                  }}
                >
                  <SelectTrigger className="w-20 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleMonthChange('prev')}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleMonthChange('next')}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {weekdays.map((day) => (
                <div key={day} className="text-center text-xs font-medium text-foreground/60 py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days - Compact */}
            <div className="grid grid-cols-7 gap-0.5">
              {calendarDays.map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} className="h-8" />
                }

                const isToday = day.toDateString() === new Date().toDateString()
                const bookingsByStatus = getBookingsByStatusForDate.get(day.toDateString()) || []
                const hasBookings = bookingsByStatus.length > 0

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => handleDayClick(day)}
                    className={`h-15 rounded-md flex flex-col items-center justify-center transition-all ${isToday ? "bg-primary/10 border border-primary" : "hover:bg-secondary"
                      } ${hasBookings ? "cursor-pointer" : "cursor-default"}`}
                  >
                    <span className={`text-[11px] font-medium ${isToday ? "text-primary" : "text-foreground"}`}>
                      {day.getDate()}
                    </span>
                    {/* Status-colored Booking Dots */}
                    {hasBookings && (
                      <div className="flex gap-0.5 flex-wrap justify-center">
                        {bookingsByStatus.slice(0, 3).map((statusInfo, i) => (
                          <div
                            key={i}
                            className={`w-1 h-1 rounded-full ${STATUS_COLORS[statusInfo.status as keyof typeof STATUS_COLORS] || 'bg-gray-400'}`}
                            title={`${STATUS_LABELS[statusInfo.status as keyof typeof STATUS_LABELS]}: ${statusInfo.count}`}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Status Legend */}
            <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border">
              {Object.entries(STATUS_LABELS).map(([status, label]) => (
                <div key={status} className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[status as keyof typeof STATUS_COLORS]}`} />
                  <span className="text-xs text-foreground/60">{label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Column 2: Services List (Row 1) + AI Suggestions (Row 2) */}
        <div className="space-y-4">
          {/* Services List */}
          <Card className="overflow-hidden">
            <CardContent className="p-3">
              {/* Category Filter Tabs */}
              <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2">
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    variant={filterCategory === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterCategory(cat)}
                    className="rounded-full whitespace-nowrap text-xs h-7 px-3"
                  >
                    {cat === "all" ? "Tất cả" : cat}
                  </Button>
                ))}
              </div>

              {/* Search */}
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/50" />
                <Input
                  placeholder="Tìm kiếm dịch vụ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 rounded-lg h-8 text-sm"
                />
              </div>

              {/* Services List - Compact on mobile */}
              <div className="space-y-1.5 max-h-[250px] lg:max-h-[200px] overflow-y-auto pr-1">
                {filteredServices.map((service: any) => (
                  <div
                    key={service._id}
                    className="flex items-center gap-2 p-2 rounded-lg border border-border hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer bg-background"
                    onClick={() => setSelectedService(service)}
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                      <Image
                        src={service.image?.url || "/placeholder.svg"}
                        alt={service.name}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground text-sm truncate">{service.name}</h4>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Store className="w-3 h-3 text-foreground/40" />
                        <span className="text-xs text-foreground/60 truncate max-w-[120px]">
                          {service.merchant_id?.merchant_profile?.shop_name || "Cửa hàng"}
                        </span>
                      </div>
                      <p className="text-[10px] text-foreground/40">{service.duration_minutes}p</p>
                    </div>
                    <p className="font-bold text-primary text-sm whitespace-nowrap">{formatPrice(service.price_min)}</p>
                  </div>
                ))}

                {filteredServices.length === 0 && (
                  <div className="text-center py-4">
                    <Search className="w-8 h-8 text-foreground/30 mx-auto mb-2" />
                    <p className="text-foreground/60 text-sm">Không tìm thấy dịch vụ</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Suggestions Card - Active */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/20" />
            <CardHeader className="relative pb-1 pt-3 px-4">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4 text-primary" />
                Gợi ý thông minh từ AI
                <Badge variant="secondary" className="ml-1 bg-green-100 text-green-700 text-[10px] px-1.5">
                  Mới
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative pt-0 pb-3 px-4">
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => {
                    setFilterCategory("Y tế")
                    setSearchTerm("tiêm")
                  }}
                  className="flex items-center gap-2 p-2 rounded-lg bg-background/70 border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <Syringe className="w-3 h-3 text-orange-600" />
                  </div>
                  <p className="font-medium text-foreground text-xs truncate">Tiêm phòng</p>
                </button>

                <button
                  onClick={() => {
                    setFilterCategory("Spa & Grooming")
                    setSearchTerm("")
                  }}
                  className="flex items-center gap-2 p-2 rounded-lg bg-background/70 border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Bath className="w-3 h-3 text-blue-600" />
                  </div>
                  <p className="font-medium text-foreground text-xs truncate">Spa & Grooming</p>
                </button>

                <button
                  onClick={() => {
                    setFilterCategory("all")
                    setSearchTerm("tẩy giun")
                  }}
                  className="flex items-center gap-2 p-2 rounded-lg bg-background/70 border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Bug className="w-3 h-3 text-green-600" />
                  </div>
                  <p className="font-medium text-foreground text-xs truncate">Tẩy giun</p>
                </button>

                <button
                  onClick={() => {
                    setFilterCategory("Y tế")
                    setSearchTerm("khám")
                  }}
                  className="flex items-center gap-2 p-2 rounded-lg bg-background/70 border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Stethoscope className="w-3 h-3 text-purple-600" />
                  </div>
                  <p className="font-medium text-foreground text-xs truncate">Khám định kỳ</p>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Day Appointments Popup - Shows ALL pets' bookings */}
      <Dialog open={showDayAppointments} onOpenChange={setShowDayAppointments}>
        <DialogContent className="max-w-md rounded-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Calendar className="w-4 h-4 text-primary" />
              Lịch hẹn ngày {selectedCalendarDay?.toLocaleDateString("vi-VN")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {selectedCalendarDay && getBookingsForDate(selectedCalendarDay).map((booking: any) => (
              <div
                key={booking._id}
                className="flex items-start gap-3 p-3 rounded-xl border border-border bg-secondary/30"
              >
                {/* Status indicator */}
                <div className={`w-1 h-full min-h-[60px] rounded-full ${STATUS_COLORS[booking.status as keyof typeof STATUS_COLORS]}`} />

                <div className="flex-1 min-w-0">
                  {/* Service name */}
                  <h4 className="font-bold text-foreground text-sm">{booking.service_id?.name || "Dịch vụ"}</h4>

                  {/* Pet name with icon */}
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-sm">
                      {booking.pet_id?.species === "Dog" ? "🐕" : booking.pet_id?.species === "Cat" ? "🐈" : "🐾"}
                    </span>
                    <span className="text-sm text-foreground/70 font-medium">{booking.pet_id?.name || "Thú cưng"}</span>
                  </div>

                  {/* Time */}
                  <p className="text-xs text-foreground/60 mt-1">
                    ⏰ {new Date(booking.booking_time).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                  </p>

                  {/* Merchant */}
                  <p className="text-xs text-foreground/50 mt-0.5">
                    📍 {booking.service_id?.merchant_id?.merchant_profile?.shop_name || "Cửa hàng"}
                  </p>
                </div>

                {/* Status badge */}
                <Badge
                  className={`text-xs ${booking.status === "CONFIRMED"
                    ? "bg-green-100 text-green-700"
                    : booking.status === "COMPLETED"
                      ? "bg-blue-100 text-blue-700"
                      : booking.status === "CANCELLED"
                        ? "bg-red-100 text-red-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                >
                  {STATUS_LABELS[booking.status as keyof typeof STATUS_LABELS]}
                </Badge>
              </div>
            ))}

            {selectedCalendarDay && getBookingsForDate(selectedCalendarDay).length === 0 && (
              <div className="text-center py-6">
                <Calendar className="w-10 h-10 text-foreground/30 mx-auto mb-2" />
                <p className="text-foreground/60 text-sm">Không có lịch hẹn trong ngày này</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Booking Modal - Improved UI (UNCHANGED logic) */}
      <Dialog
        open={!!selectedService}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedService(null)
            setBookingStep(1)
            setBookingSuccess(false)
            setSelectedDate("")
            setSelectedTime("")
            setBookedSlots([])
          }
        }}
      >
        <DialogContent className="max-w-xl rounded-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
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
              <DialogHeader className="pb-3 border-b border-border">
                <DialogTitle className="flex items-center gap-3">
                  {bookingStep > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setBookingStep(bookingStep - 1)}
                      className="rounded-full h-8 w-8"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                  )}
                  <div className="flex items-center gap-3">
                    <span className="text-base">Đặt lịch dịch vụ</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3].map((step) => (
                        <div
                          key={step}
                          className={`w-2 h-2 rounded-full transition-all ${step === bookingStep ? "w-5 bg-primary" : step < bookingStep ? "bg-primary" : "bg-border"
                            }`}
                        />
                      ))}
                    </div>
                  </div>
                </DialogTitle>
              </DialogHeader>

              {selectedService && (
                <div className="space-y-4 pt-3">
                  {/* Service Info Card - Compact */}
                  <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
                          <Image
                            src={selectedService.image?.url || "/placeholder.svg"}
                            alt={selectedService.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-foreground">{selectedService.name}</h4>
                          <p className="text-xs text-foreground/60 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {selectedService.merchant_id?.merchant_profile?.shop_name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-bold text-primary">{formatPrice(selectedService.price_min)}</span>
                            <Badge variant="secondary" className="text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              {selectedService.duration_minutes}p
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Step 1: Select Pet & Date */}
                  {bookingStep === 1 && (
                    <div className="space-y-4">
                      {/* Pet Selection */}
                      <div>
                        <Label className="text-foreground font-semibold text-sm mb-2 block">
                          🐾 Chọn thú cưng
                        </Label>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {pets?.map((pet) => (
                            <button
                              key={pet._id}
                              onClick={() => setSelectedPet(pet._id)}
                              className={`p-2 rounded-xl border-2 transition-all w-20 ${selectedPet === pet._id
                                ? "border-primary bg-primary/5 shadow-md"
                                : "border-border hover:border-primary/50"
                                }`}
                            >
                              <div className="w-10 h-10 rounded-full overflow-hidden mx-auto mb-1 bg-secondary">
                                <Image
                                  src={pet.image?.url || "/placeholder.svg"}
                                  alt={pet.name}
                                  width={40}
                                  height={40}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <p className="text-xs font-semibold text-foreground text-center truncate">{pet.name}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Date Selection */}
                      <div>
                        <Label className="text-foreground font-semibold text-sm mb-2 block">
                          📅 Chọn ngày
                        </Label>
                        <div className="grid grid-cols-7 gap-1">
                          {dates.map((date) => (
                            <button
                              key={date.full}
                              onClick={() => {
                                setSelectedDate(date.full)
                                setSelectedTime("") // Reset time when date changes
                              }}
                              className={`p-1.5 rounded-lg border-2 transition-all text-center ${selectedDate === date.full
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border hover:border-primary/50"
                                }`}
                            >
                              <p className="text-[10px] opacity-70">{date.weekday}</p>
                              <p className="text-sm font-bold">{date.day}</p>
                              <p className="text-[10px] opacity-70">{date.month}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      <Button
                        onClick={() => setBookingStep(2)}
                        disabled={!selectedPet || !selectedDate}
                        className="w-full rounded-xl py-5"
                      >
                        Tiếp tục chọn giờ
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  )}

                  {/* Step 2: Select Time */}
                  {bookingStep === 2 && (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-foreground font-semibold text-sm mb-2 block">
                          ⏰ Chọn giờ - {selectedDate}
                        </Label>

                        {loadingSlots ? (
                          <div className="flex items-center justify-center py-6">
                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                            <span className="ml-2 text-foreground/60 text-sm">Đang tải lịch...</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-5 gap-2">
                            {availableTimes.map((time) => {
                              const isBooked = bookedSlots.includes(time)
                              return (
                                <button
                                  key={time}
                                  onClick={() => !isBooked && setSelectedTime(time)}
                                  disabled={isBooked}
                                  className={`p-2 rounded-lg border-2 transition-all ${isBooked
                                    ? "border-destructive/30 bg-destructive/5 cursor-not-allowed opacity-60"
                                    : selectedTime === time
                                      ? "border-primary bg-primary text-primary-foreground shadow-md"
                                      : "border-border hover:border-primary/50"
                                    }`}
                                >
                                  {isBooked ? (
                                    <>
                                      <XCircle className="w-3 h-3 mx-auto mb-0.5 text-destructive/60" />
                                      <p className="font-medium text-xs line-through">{time}</p>
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="w-3 h-3 mx-auto mb-0.5" />
                                      <p className="font-semibold text-sm">{time}</p>
                                    </>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>

                      <div>
                        <Label className="text-foreground font-semibold text-sm mb-2 block">
                          📝 Ghi chú (không bắt buộc)
                        </Label>
                        <Textarea
                          placeholder="VD: Bé hay sợ nước, cần nhẹ nhàng..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="rounded-xl resize-none"
                          rows={2}
                        />
                      </div>

                      <Button
                        onClick={() => setBookingStep(3)}
                        disabled={!selectedTime}
                        className="w-full rounded-xl py-5"
                      >
                        Xem lại đặt lịch
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  )}

                  {/* Step 3: Confirm */}
                  {bookingStep === 3 && (
                    <div className="space-y-4">
                      <Card className="overflow-hidden">
                        <CardHeader className="bg-secondary/50 py-2 px-4">
                          <CardTitle className="text-sm">📋 Thông tin đặt lịch</CardTitle>
                        </CardHeader>
                        <CardContent className="divide-y divide-border p-0">
                          <div className="flex justify-between py-2 px-4">
                            <span className="text-foreground/60 text-sm">Dịch vụ</span>
                            <span className="font-semibold text-foreground text-sm">{selectedService.name}</span>
                          </div>
                          <div className="flex justify-between py-2 px-4">
                            <span className="text-foreground/60 text-sm">Thú cưng</span>
                            <span className="font-semibold text-foreground text-sm">
                              {pets?.find((p) => p._id === selectedPet)?.name}
                            </span>
                          </div>
                          <div className="flex justify-between py-2 px-4">
                            <span className="text-foreground/60 text-sm">Thời gian</span>
                            <span className="font-semibold text-foreground text-sm">{selectedTime} - {selectedDate}</span>
                          </div>
                          <div className="flex justify-between py-2 px-4">
                            <span className="text-foreground/60 text-sm">Địa điểm</span>
                            <span className="font-semibold text-foreground text-sm flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {selectedService.merchant_id?.merchant_profile?.shop_name}
                            </span>
                          </div>
                          {notes && (
                            <div className="py-2 px-4">
                              <span className="text-foreground/60 block mb-1 text-sm">Ghi chú</span>
                              <span className="text-foreground text-sm">{notes}</span>
                            </div>
                          )}
                          <div className="flex justify-between py-3 px-4 bg-secondary/30">
                            <span className="font-bold text-foreground">Tổng cộng</span>
                            <span className="font-bold text-primary text-lg">{formatPrice(selectedService.price_min)}</span>
                          </div>
                        </CardContent>
                      </Card>

                      <Button
                        onClick={handleBooking}
                        disabled={isSubmitting}
                        className="w-full rounded-xl py-5 bg-green-600 hover:bg-green-700"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 mr-2" />
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

      {/* Alert Dialog */}
      <AlertDialog
        open={alertState.open}
        onOpenChange={closeAlert}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        confirmText={alertState.confirmText}
        onConfirm={alertState.onConfirm}
        showCancel={alertState.showCancel}
      />
    </div>
  )
}
