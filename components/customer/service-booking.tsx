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
import { Calendar, Clock, Star, Search, ChevronLeft, ChevronRight, CheckCircle2, Loader2, MapPin, XCircle, Store, Info } from "lucide-react"
import Image from "next/image"
import { AlertDialog, useAlertDialog } from "@/components/ui/alert-dialog-custom"
import { motion } from "framer-motion"

// Kawaii Pastel Palette for Status
const STATUS_COLORS = {
  PENDING: "bg-[#ffd4b8]",   // Pastel Orange
  CONFIRMED: "bg-[#c1e1c1]", // Pastel Green
  COMPLETED: "bg-[#b0e0e6]", // Powder Blue
  CANCELLED: "bg-[#ffb7b2]", // Pastel Red
}

// Map status to classes for consistency
const STATUS_CLASSES = {
  PENDING: "bg-[#ffd4b8] text-[#854d0e]",
  CONFIRMED: "bg-[#c1e1c1] text-[#166534]",
  COMPLETED: "bg-[#b0e0e6] text-[#1e40af]",
  CANCELLED: "bg-[#ffb7b2] text-[#991b1b]",
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
  const [priceRange, setPriceRange] = useState("all")
  const [sortBy, setSortBy] = useState("default")
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

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 24

  const filteredAndSortedServices = useMemo(() => {
    let result = services.filter((service: any) => {
      const matchesSearch =
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (service.description || "").toLowerCase().includes(searchTerm.toLowerCase())
      
      let matchesCategory = true;
      if (filterCategory !== "all") {
        const name = service.name.toLowerCase();
        if (filterCategory === "Y tế") matchesCategory = name.includes("khám") || name.includes("tiêm") || name.includes("bác sĩ");
        else if (filterCategory === "Spa & Grooming") matchesCategory = name.includes("tắm") || name.includes("cắt") || name.includes("spa") || name.includes("grooming");
        else if (filterCategory === "Huấn luyện") matchesCategory = name.includes("huấn") || name.includes("dạy") || name.includes("trường");
      }

      let matchesPrice = true;
      if (priceRange !== "all") {
        const price = service.price_min;
        if (priceRange === "under-200") matchesPrice = price < 200000;
        else if (priceRange === "200-500") matchesPrice = price >= 200000 && price <= 500000;
        else if (priceRange === "over-500") matchesPrice = price > 500000;
      }

      return matchesSearch && matchesCategory && matchesPrice
    })

    if (sortBy === "price-asc") result.sort((a: any, b: any) => a.price_min - b.price_min)
    else if (sortBy === "price-desc") result.sort((a: any, b: any) => b.price_min - a.price_min)
    else if (sortBy === "name-asc") result.sort((a: any, b: any) => a.name.localeCompare(b.name))

    return result
  }, [services, searchTerm, filterCategory, priceRange, sortBy])

  const totalPages = Math.ceil(filteredAndSortedServices.length / itemsPerPage)
  const displayedServices = filteredAndSortedServices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterCategory, priceRange, sortBy])

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

  // Calendar helpers
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

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDayOfWeek = firstDay.getDay()
    const daysInMonth = lastDay.getDate()
    const days: (Date | null)[] = []
    for (let i = 0; i < startDayOfWeek; i++) days.push(null)
    for (let day = 1; day <= daysInMonth; day++) days.push(new Date(year, month, day))
    return days
  }

  const calendarDays = generateCalendarDays()
  const weekdays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
  const months = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"]

  const handleMonthChange = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') newDate.setMonth(prev.getMonth() - 1)
      else newDate.setMonth(prev.getMonth() + 1)
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
    <div className="flex flex-col h-[calc(100vh-100px)] lg:h-[calc(100vh-140px)] -mt-4 lg:-mt-2 overflow-hidden gap-4">
      {/* Calendar Section */}
      <Card className="rounded-[30px] border-none shadow-[0_10px_25px_-5px_rgba(241,90,41,0.1)] bg-white shrink-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-[#2d3561] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#f15a29]" />
              Lịch của tôi
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-[#fff5f0]"
                onClick={() => handleMonthChange('prev')}
              >
                <ChevronLeft className="w-5 h-5 text-[#f15a29]" />
              </Button>
              <span className="font-bold text-sm min-w-[120px] text-center text-[#2d3561]">
                {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-[#fff5f0]"
                onClick={() => handleMonthChange('next')}
              >
                <ChevronRight className="w-5 h-5 text-[#f15a29]" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekdays.map((day) => (
              <div key={day} className="text-center text-[10px] uppercase font-bold text-[#2d3561]/40">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (!day) return <div key={`empty-${index}`} className="h-10" />

              const isToday = day.toDateString() === new Date().toDateString()
              const bookingsByStatus = getBookingsByStatusForDate.get(day.toDateString()) || []
              const hasBookings = bookingsByStatus.length > 0

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  className={`h-12 rounded-2xl flex flex-col items-center justify-center transition-all relative
                    ${isToday ? "bg-[#f15a29]/10 border-2 border-[#f15a29]/20" : "hover:bg-[#fff5f0]/50 border-2 border-transparent"}
                    ${hasBookings ? "cursor-pointer" : "cursor-default"}`}
                >
                  <span className={`text-xs font-bold ${isToday ? "text-[#f15a29]" : "text-[#2d3561]"}`}>
                    {day.getDate()}
                  </span>
                  {hasBookings && (
                    <div className="absolute bottom-1.5 flex gap-0.5">
                      {bookingsByStatus.slice(0, 3).map((statusInfo, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[statusInfo.status as keyof typeof STATUS_COLORS] || 'bg-gray-400'}`}
                        />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Services Section */}
      <div className="flex-1 flex flex-col min-h-0 bg-white rounded-[30px] shadow-[0_10px_25px_-5px_rgba(241,90,41,0.15)] overflow-hidden transition-all duration-500">
        <div className="p-4 pb-2 border-b border-[#fff5f0]/30 shrink-0">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-[#2d3561] flex items-center gap-2 w-full sm:w-auto">
              <Store className="w-5 h-5 text-[#f15a29]" />
              Dịch vụ đặt chỗ
            </h2>
            <div className="relative w-full sm:max-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2d3561]/30" />
              <Input
                placeholder="Tìm dịch vụ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-full bg-[#fff5f0]/50 border-none h-10 text-sm focus-visible:ring-[#f15a29]"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 py-1">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[130px] rounded-full bg-[#fff5f0]/50 border-none h-8 text-[11px] font-bold text-[#2d3561] focus:ring-[#f15a29] transition-all hover:bg-[#fff5f0]">
                <SelectValue placeholder="Danh mục" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-xl bg-white/95 backdrop-blur-sm">
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-[11px] font-bold text-[#5a6178] focus:bg-[#fff5f0] focus:text-[#f15a29] transition-colors rounded-xl mx-1 my-0.5">
                    {cat === "all" ? "Tất cả dịch vụ" : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger className="w-[120px] rounded-full bg-[#fff5f0]/50 border-none h-8 text-[11px] font-bold text-[#2d3561] focus:ring-[#f15a29] transition-all hover:bg-[#fff5f0]">
                <SelectValue placeholder="Giá cả" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-xl bg-white/95 backdrop-blur-sm">
                <SelectItem value="all" className="text-[11px] font-bold text-[#5a6178] focus:bg-[#fff5f0] focus:text-[#f15a29] rounded-xl mx-1 my-0.5">Tất cả giá</SelectItem>
                <SelectItem value="under-200" className="text-[11px] font-bold text-[#5a6178] focus:bg-[#fff5f0] focus:text-[#f15a29] rounded-xl mx-1 my-0.5">Dưới 200k</SelectItem>
                <SelectItem value="200-500" className="text-[11px] font-bold text-[#5a6178] focus:bg-[#fff5f0] focus:text-[#f15a29] rounded-xl mx-1 my-0.5">200k - 500k</SelectItem>
                <SelectItem value="over-500" className="text-[11px] font-bold text-[#5a6178] focus:bg-[#fff5f0] focus:text-[#f15a29] rounded-xl mx-1 my-0.5">Trên 500k</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[120px] rounded-full bg-[#fff5f0]/50 border-none h-8 text-[11px] font-bold text-[#2d3561] focus:ring-[#f15a29] transition-all hover:bg-[#fff5f0]">
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-xl bg-white/95 backdrop-blur-sm">
                <SelectItem value="default" className="text-[11px] font-bold text-[#5a6178] focus:bg-[#fff5f0] focus:text-[#f15a29] rounded-xl mx-1 my-0.5">Mặc định</SelectItem>
                <SelectItem value="price-asc" className="text-[11px] font-bold text-[#5a6178] focus:bg-[#fff5f0] focus:text-[#f15a29] rounded-xl mx-1 my-0.5">Giá thấp nhất</SelectItem>
                <SelectItem value="price-desc" className="text-[11px] font-bold text-[#5a6178] focus:bg-[#fff5f0] focus:text-[#f15a29] rounded-xl mx-1 my-0.5">Giá cao nhất</SelectItem>
                <SelectItem value="name-asc" className="text-[11px] font-bold text-[#5a6178] focus:bg-[#fff5f0] focus:text-[#f15a29] rounded-xl mx-1 my-0.5">Tên A-Z</SelectItem>
              </SelectContent>
            </Select>

            {(filterCategory !== "all" || priceRange !== "all" || sortBy !== "default") && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { setFilterCategory("all"); setPriceRange("all"); setSortBy("default") }}
                className="h-8 rounded-full text-[10px] font-extrabold text-[#f15a29] hover:bg-red-50"
              >
                Làm mới
              </Button>
            )}
          </div>
        </div>

        {/* Scrollable Grid Container */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 flex flex-col">
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 flex-1">
            {displayedServices.map((service: any) => (
              <div
                key={service._id}
                className="group relative flex flex-col bg-white rounded-[25px] border border-[#fff5f0]/50 hover:border-[#ffdab9] shadow-[0_4px_10px_-2px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_30px_-5px_rgba(241,90,41,0.15)] transition-all duration-300 transform hover:-translate-y-1 cursor-pointer overflow-hidden p-1.5"
                onClick={() => setSelectedService(service)}
              >
                <div className="aspect-square rounded-[20px] overflow-hidden bg-[#fff5f0]/30 mb-2">
                  <Image
                    src={service.image?.url || "/placeholder.svg"}
                    alt={service.name}
                    width={150}
                    height={150}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                
                <div className="px-1 flex-1 flex flex-col">
                  <h4 className="font-bold text-[#2d3561] text-[11px] line-clamp-1 mb-1 leading-tight">
                    {service.name}
                  </h4>
                  
                  <div className="flex items-center gap-1 mb-2 opacity-70">
                    <Store className="w-2.5 h-2.5 text-[#f15a29]" />
                    <span className="text-[9px] font-bold text-[#5a6178] truncate">
                      {service.merchant_id?.merchant_profile?.shop_name || "Pet shop"}
                    </span>
                  </div>
                  
                  <div className="mt-auto">
                    <div className="flex items-center justify-between gap-1 mb-1.5 overflow-hidden">
                       <Badge variant="secondary" className="bg-[#e0f2fe] text-[#3b6db3] text-[9px] rounded-full px-1.5 py-0 h-4 flex items-center gap-0.5 border-none shrink-0">
                        <Clock className="w-2.5 h-2.5" />
                        {service.duration_minutes}m
                      </Badge>
                      <span className="font-extrabold text-[#f15a29] text-[11px] whitespace-nowrap">
                        {Math.floor(service.price_min / 1000)}k
                        <small className="text-[8px] font-normal ml-0.5">₫</small>
                      </span>
                    </div>
                    
                    <Button 
                      className="w-full rounded-xl h-7 bg-[#f15a29] hover:bg-[#f15a29]/90 text-white text-[10px] font-bold shadow-sm border-none"
                    >
                      Đặt ngay
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {displayedServices.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center opacity-50">
                <Search className="w-10 h-10 mb-3 text-[#f15a29]/30" />
                <p className="text-[#2d3561]/60 font-bold text-sm">Không tìm thấy dịch vụ nào đâu~</p>
              </div>
            )}
          </div>

          {/* Pagination Bar */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6 pb-4">
              <Button
                variant="ghost"
                size="icon"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="h-8 w-8 rounded-full bg-[#fff5f0] text-[#f15a29] hover:bg-[#ffdab9] disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <div className="flex items-center gap-1.5 px-4 h-8 bg-[#fff5f0]/50 rounded-full border border-[#fff5f0]">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-6 h-6 rounded-full text-[10px] font-black transition-all
                      ${currentPage === page 
                        ? "bg-[#f15a29] text-white shadow-sm scale-110" 
                        : "text-[#2d3561]/40 hover:text-[#f15a29]"}`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <Button
                variant="ghost"
                size="icon"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="h-8 w-8 rounded-full bg-[#fff5f0] text-[#f15a29] hover:bg-[#ffdab9] disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Day Appointments Popup */}
      <Dialog open={showDayAppointments} onOpenChange={setShowDayAppointments}>
        <DialogContent className="max-w-md rounded-[30px] border-none shadow-2xl p-6 overflow-hidden bg-white">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-3 text-lg font-bold text-[#2d3561]">
              <div className="w-10 h-10 rounded-2xl bg-[#fff5f0] flex items-center justify-center">
                <Calendar className="w-5 h-5 text-[#f15a29]" />
              </div>
              Lịch hẹn {selectedCalendarDay?.toLocaleDateString("vi-VN")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto no-scrollbar pr-1">
            {selectedCalendarDay && getBookingsForDate(selectedCalendarDay).map((booking: any) => (
              <div
                key={booking._id}
                className="flex items-start gap-4 p-4 rounded-[25px] border border-[#fff5f0] bg-[#fff5f0]/20 hover:bg-[#fff5f0]/40 transition-colors"
              >
                <div className={`w-1.5 h-12 rounded-full shrink-0 ${STATUS_COLORS[booking.status as keyof typeof STATUS_COLORS] || 'bg-gray-200'}`} />
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-[#2d3561] text-sm truncate">{booking.service_id?.name || "Dịch vụ"}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 bg-white rounded-full border border-[#fff5f0] font-bold text-[#5a6178]">
                      {booking.pet_id?.species === "Dog" ? "🐶" : booking.pet_id?.species === "Cat" ? "🐱" : "🐾"} {booking.pet_id?.name}
                    </span>
                    <span className="text-xs text-[#5a6178] font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(booking.booking_time).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <Badge className={`text-[10px] rounded-full px-3 py-1 border-none font-bold uppercase ${STATUS_CLASSES[booking.status as keyof typeof STATUS_CLASSES] || 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABELS[booking.status as keyof typeof STATUS_LABELS]}
                </Badge>
              </div>
            ))}

            {selectedCalendarDay && getBookingsForDate(selectedCalendarDay).length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-[#fff5f0] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-[#f15a29]/30" />
                </div>
                <p className="text-[#5a6178] font-bold">Trống lịch rồi bạn ơi~</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Booking Modal */}
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
        <DialogContent className="max-w-xl rounded-[35px] border-none shadow-2xl p-0 overflow-hidden bg-[#fffbf8]">
          {bookingSuccess ? (
            <div className="py-12 text-center px-6">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-24 h-24 bg-[#f0fdf4] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-100"
              >
                <CheckCircle2 className="w-12 h-12 text-[#166534]" />
              </motion.div>
              <h3 className="text-2xl font-bold text-[#2d3561] mb-2">Đặt lịch thành công! ✨</h3>
              <p className="text-[#5a6178] font-medium">Bé {pets?.find(p => p._id === selectedPet)?.name} đang chờ gặp bạn đó!</p>
            </div>
          ) : (
            <div className="flex flex-col max-h-[90vh]">
              <DialogHeader className="p-6 pb-2">
                <DialogTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {bookingStep > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setBookingStep(bookingStep - 1)}
                        className="rounded-full h-10 w-10 bg-white shadow-sm hover:bg-[#fff5f0]"
                      >
                        <ChevronLeft className="w-6 h-6 text-[#f15a29]" />
                      </Button>
                    )}
                    <div className="flex flex-col">
                      <span className="text-lg font-extrabold text-[#2d3561]">Đặt chỗ nhanh</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        {[1, 2, 3].map((step) => (
                          <div
                            key={step}
                            className={`h-1.5 rounded-full transition-all duration-300 ${step === bookingStep ? "w-8 bg-[#f15a29]" : step < bookingStep ? "w-4 bg-[#f15a29]/40" : "w-4 bg-gray-200"}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto no-scrollbar p-6 pt-2 space-y-6">
                {selectedService && (
                  <>
                    {/* Service Info Header */}
                    <div className="bg-white p-4 rounded-[25px] flex items-center gap-4 shadow-sm border border-[#fff5f0]">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#fff5f0] shrink-0">
                        <Image
                          src={selectedService.image?.url || "/placeholder.svg"}
                          alt={selectedService.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-[#2d3561] text-base truncate">{selectedService.name}</h4>
                        <p className="text-[10px] font-bold text-[#5a6178]/60 flex items-center gap-1 mb-1">
                          <Store className="w-3 h-3 text-[#f15a29]/50" />
                          {selectedService.merchant_id?.merchant_profile?.shop_name || "Pet shop"}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                           <span className="font-extrabold text-[#f15a29] text-base">{formatPrice(selectedService.price_min)}</span>
                           <span className="text-xs font-bold text-[#5a6178]/60 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {selectedService.duration_minutes} phút
                           </span>
                        </div>
                      </div>
                    </div>

                    {/* Step Content */}
                    {bookingStep === 1 && (
                      <div className="space-y-6 animate-fade-in">
                        <section>
                          <Label className="text-[#2d3561] font-extrabold text-sm mb-3 block flex items-center gap-2">
                            <span>🐾</span> Chọn bé yêu nhà mình
                          </Label>
                          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                            {pets?.map((pet) => (
                              <button
                                key={pet._id}
                                onClick={() => setSelectedPet(pet._id)}
                                className={`flex flex-col items-center shrink-0 p-3 rounded-[25px] border-3 transition-all w-24
                                  ${selectedPet === pet._id ? "border-[#f15a29] bg-white shadow-lg" : "border-transparent bg-white/50 hover:bg-white"}`}
                              >
                                <div className="w-12 h-12 rounded-full overflow-hidden mb-2 border-2 border-[#fff5f0]">
                                  <Image src={pet.image?.url || "/placeholder.svg"} alt={pet.name} width={48} height={48} className="w-full h-full object-cover" />
                                </div>
                                <span className="text-xs font-bold text-[#2d3561] truncate w-full text-center">{pet.name}</span>
                              </button>
                            ))}
                          </div>
                        </section>

                        <section>
                          <Label className="text-[#2d3561] font-extrabold text-sm mb-3 block flex items-center gap-2">
                            <span>📅</span> Chọn ngày hẹn
                          </Label>
                          <div className="grid grid-cols-7 gap-1.5 focus:outline-none">
                            {dates.map((date) => (
                              <button
                                key={date.full}
                                onClick={() => { setSelectedDate(date.full); setSelectedTime("") }}
                                className={`flex flex-col items-center justify-center p-2 rounded-2xl border-2 transition-all
                                  ${selectedDate === date.full ? "border-[#f15a29] bg-[#f15a29] text-white shadow-md" : "border-[#fff5f0] bg-white hover:border-[#f15a29]/30"}`}
                              >
                                <span className="text-[9px] uppercase font-bold opacity-70">{date.weekday}</span>
                                <span className="text-sm font-black">{date.day}</span>
                              </button>
                            ))}
                          </div>
                        </section>

                        <Button
                          onClick={() => setBookingStep(2)}
                          disabled={!selectedPet || !selectedDate}
                          className="w-full rounded-[25px] h-14 bg-[#f15a29] hover:bg-[#d94e20] text-white text-base font-black shadow-xl shadow-[#f15a29]/20 transition-all active:scale-[0.98]"
                        >
                          Tiếp theo nào!
                          <ChevronRight className="w-5 h-5 ml-2" />
                        </Button>
                      </div>
                    )}

                    {bookingStep === 2 && (
                      <div className="space-y-6 animate-fade-in">
                        <section>
                          <Label className="text-[#2d3561] font-extrabold text-sm mb-3 block">
                            ⏰ Mấy giờ thì tiện bạn nhỉ? ({selectedDate})
                          </Label>

                          {loadingSlots ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-3 grayscale opacity-50">
                              <Loader2 className="w-8 h-8 animate-spin text-[#f15a29]" />
                              <span className="text-sm font-bold text-[#5a6178]">Đang xem lịch bé...</span>
                            </div>
                          ) : (
                            <div className="grid grid-cols-4 gap-2.5">
                              {availableTimes.map((time) => {
                                const isBooked = bookedSlots.includes(time)
                                return (
                                  <button
                                    key={time}
                                    onClick={() => !isBooked && setSelectedTime(time)}
                                    disabled={isBooked}
                                    className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1
                                      ${isBooked ? "bg-gray-50 border-gray-100 opacity-40 cursor-not-allowed" : 
                                        selectedTime === time ? "border-[#f15a29] bg-[#f15a29] text-white shadow-md shadow-[#f15a29]/20" : 
                                        "bg-white border-[#fff5f0] hover:border-[#f15a29]/30"}`}
                                  >
                                    <Clock className={`w-3.5 h-3.5 ${selectedTime === time ? 'text-white' : 'text-[#f15a29]'}`} />
                                    <span className="text-sm font-black">{time}</span>
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </section>

                        <section>
                          <Label className="text-[#2d3561] font-extrabold text-sm mb-3 block">
                            📝 Dặn dò chúng mình (không bắt buộc)
                          </Label>
                          <Textarea
                            placeholder="Nhập ghi chú cho bé tại đây..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="rounded-[20px] bg-white border-[#fff5f0] focus:ring-[#f15a29] p-4 text-sm"
                            rows={3}
                          />
                        </section>

                        <Button
                          onClick={() => setBookingStep(3)}
                          disabled={!selectedTime}
                          className="w-full rounded-[25px] h-14 bg-[#f15a29] hover:bg-[#d94e20] text-white text-base font-black shadow-xl shadow-[#f15a29]/20"
                        >
                          Kiểm tra lại lần nữa
                          <ChevronRight className="w-5 h-5 ml-2" />
                        </Button>
                      </div>
                    )}

                    {bookingStep === 3 && (
                      <div className="space-y-6 animate-fade-in">
                        <Card className="rounded-[30px] border-none bg-white shadow-sm overflow-hidden">
                          <div className="p-5 space-y-4">
                            <div className="flex justify-between items-center pb-3 border-b border-[#fff5f0]">
                              <span className="text-xs font-bold text-[#5a6178]">Dịch vụ</span>
                              <span className="text-sm font-black text-[#2d3561]">{selectedService.name}</span>
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b border-[#fff5f0]">
                              <span className="text-xs font-bold text-[#5a6178]">Bé cưng</span>
                              <span className="text-sm font-black text-[#2d3561]">{pets?.find(p => p._id === selectedPet)?.name}</span>
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b border-[#fff5f0]">
                              <span className="text-xs font-bold text-[#5a6178]">Thời gian</span>
                              <span className="text-sm font-black text-[#2d3561]">{selectedTime}, {selectedDate}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-[#5a6178]">Thanh toán</span>
                              <span className="text-lg font-black text-[#f15a29]">{formatPrice(selectedService.price_min)}</span>
                            </div>
                          </div>
                        </Card>

                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
                           <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                           <p className="text-[11px] font-medium text-amber-800 leading-relaxed">
                             Vui lòng đến đúng giờ để bé được chăm sóc tốt nhất nhé! Nếu có thay đổi, hãy báo cho chúng mình trước 2 tiếng.
                           </p>
                        </div>

                        <Button
                          onClick={handleBooking}
                          disabled={isSubmitting}
                          className="w-full rounded-[25px] h-14 bg-[#f15a29] hover:bg-[#d94e20] text-white text-lg font-black shadow-xl shadow-[#f15a29]/30 active:scale-[0.98] transition-all"
                        >
                          {isSubmitting ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>Đang gửi...</span>
                            </div>
                          ) : (
                            "Xác nhận đặt lịch ngay!"
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
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
