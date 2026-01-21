"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  PawPrint,
  Sparkles,
  ShoppingBag,
  Calendar,
  Shield,
  Heart,
  Star,
  CheckCircle2,
  Menu,
  X,
  Play,
  ArrowRight,
  Zap,
  Users,
  Award,
  Clock,
  MessageCircle,
} from "lucide-react"
import { useState, useEffect } from "react"
import { useCustomerPackages, useMerchantPackages } from "@/lib/hooks"
import { OnboardingModal } from "@/components/onboarding-modal"

const features = [
  {
    icon: Sparkles,
    title: "AI Kiểm Tra Sức Khỏe",
    description: "Nút Diệu Kỳ - Kiểm tra sức khỏe thú cưng với AI thông minh",
    color: "from-primary to-primary/70",
  },
  {
    icon: Shield,
    title: "Hồ Sơ Y Tế Số",
    description: "Lưu trữ và quản lý toàn bộ lịch sử khám chữa bệnh",
    color: "from-accent to-accent/70",
  },
  {
    icon: ShoppingBag,
    title: "Marketplace",
    description: "Mua sắm sản phẩm được AI gợi ý phù hợp với thú cưng",
    color: "from-green-500 to-green-400",
  },
  {
    icon: Calendar,
    title: "Đặt Dịch Vụ",
    description: "Đặt lịch spa, grooming, khám bệnh dễ dàng",
    color: "from-purple-500 to-purple-400",
  },
]

const stats = [
  { number: "10K+", label: "Người dùng", icon: Users },
  { number: "500+", label: "Đối tác", icon: Award },
  { number: "50K+", label: "Đơn hàng", icon: ShoppingBag },
  { number: "4.9", label: "Đánh giá", icon: Star },
]

const testimonials = [
  {
    name: "Minh Anh",
    avatar: "/young-woman-smiling.png",
    content:
      "TailMates giúp mình quản lý sức khỏe cho 3 bé mèo cực kỳ tiện lợi! Không còn lo quên lịch tiêm phòng nữa.",
    rating: 5,
    pet: "3 bé mèo",
  },
  {
    name: "Hoàng Nam",
    avatar: "/young-man-portrait.png",
    content: "Nút Diệu Kỳ thực sự hữu ích, mình phát hiện bé Corgi bị đau bụng sớm nhờ AI phân tích.",
    rating: 5,
    pet: "Corgi 2 tuổi",
  },
  {
    name: "Thu Hà",
    avatar: "/girl-with-glasses-smiling.jpg",
    content: "Marketplace gợi ý đúng sản phẩm bé thích, không cần tìm kiếm nhiều. Giao hàng cũng rất nhanh!",
    rating: 5,
    pet: "Golden 1 tuổi",
  },
]



const howItWorks = [
  {
    step: 1,
    title: "Đăng ký tài khoản",
    description: "Tạo tài khoản miễn phí chỉ trong 30 giây",
    icon: Users,
  },
  {
    step: 2,
    title: "Thêm thú cưng",
    description: "Nhập thông tin và ảnh bé cưng của bạn",
    icon: PawPrint,
  },
  {
    step: 3,
    title: "Khám phá tính năng",
    description: "Sử dụng AI, đặt dịch vụ, mua sắm thông minh",
    icon: Sparkles,
  },
  {
    step: 4,
    title: "Chăm sóc bé yêu",
    description: "Quản lý sức khỏe và hạnh phúc của bé",
    icon: Heart,
  },
]

export function Homepage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  const { data: customerPackages } = useCustomerPackages()
  const { data: merchantPackages } = useMerchantPackages()

  const pricingPlans = [
    ...(customerPackages || []).map((pkg: any) => ({
      name: pkg.name,
      price: new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(pkg.price),
      period: pkg.duration_months === 1 ? "/tháng" : `/${pkg.duration_months} tháng`,
      features: Array.isArray(pkg.features) ? pkg.features : [],
      popular: pkg.price > 0 && pkg.price < 200000,
      cta: "Bắt đầu ngay",
      role: "CUSTOMER"
    })),
    ...(merchantPackages || []).map((pkg: any) => ({
      name: pkg.name,
      price: new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(pkg.price),
      period: pkg.duration_months === 1 ? "/tháng" : `/${pkg.duration_months} tháng`,
      features: Array.isArray(pkg.features) ? pkg.features : [],
      popular: false,
      cta: "Đăng ký đối tác",
      role: "MERCHANT"
    }))
  ]

  // Fallback if no API data yet (e.g. initial load or empty db)
  const finalPricingPlans = pricingPlans.length > 0 ? pricingPlans.sort((a, b) => {
    // Basic sorting to keep free/cheaper first, but Merchant usually last
    if (a.role !== b.role) return a.role === "CUSTOMER" ? -1 : 1
    return parseInt(a.price) - parseInt(b.price)
  }) : [
    {
      name: "Miễn Phí",
      price: "0đ",
      period: "",
      features: ["Quản lý 1 thú cưng", "Xem sản phẩm", "Đặt dịch vụ cơ bản", "Nhắc lịch tiêm phòng"],
      popular: false,
      cta: "Bắt đầu ngay",
      role: "CUSTOMER"
    },
    {
      name: "Thành Viên",
      price: "99.000đ",
      period: "/tháng",
      features: ["Không giới hạn thú cưng", "AI Tư vấn", "Ưu đãi độc quyền"],
      popular: true,
      cta: "Dùng thử 7 ngày",
      role: "CUSTOMER"
    }
  ]

  useEffect(() => {
    setIsVisible(true)
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <div className="min-h-screen bg-background overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-2">
                <Image src="/images/logo-ngang.png" alt="TailMates" width={120} height={40} className="sm:h-16 h-8 w-auto" />
              </Link>

              <nav className="hidden md:flex items-center gap-8">
                <a
                  href="#features"
                  className="text-foreground/70 hover:text-primary transition-colors font-medium text-sm"
                >
                  Tính năng
                </a>
                <a
                  href="#how-it-works"
                  className="text-foreground/70 hover:text-primary transition-colors font-medium text-sm"
                >
                  Cách hoạt động
                </a>
                <a
                  href="#testimonials"
                  className="text-foreground/70 hover:text-primary transition-colors font-medium text-sm"
                >
                  Đánh giá
                </a>
                <Link
                  href="/blog"
                  className="text-foreground/70 hover:text-primary transition-colors font-medium text-sm"
                >
                  Blog
                </Link>
              </nav>

              <div className="hidden md:flex items-center gap-3">
                <Link href="/login">
                  <Button variant="ghost" className="font-medium rounded-xl">
                    Đăng nhập
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
                    Đăng ký miễn phí
                  </Button>
                </Link>
              </div>

              <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden bg-card border-t border-border animate-in slide-in-from-top-2">
              <div className="px-4 py-4 space-y-4">
                <a href="#features" className="block text-foreground/70 hover:text-foreground font-medium">
                  Tính năng
                </a>
                <a href="#how-it-works" className="block text-foreground/70 hover:text-foreground font-medium">
                  Cách hoạt động
                </a>
                <a href="#testimonials" className="block text-foreground/70 hover:text-foreground font-medium">
                  Đánh giá
                </a>
                <Link href="/blog" className="block text-foreground/70 hover:text-foreground font-medium">
                  Blog
                </Link>
                <div className="flex flex-col gap-2 pt-4 border-t border-border">
                  <Link href="/login">
                    <Button variant="outline" className="w-full bg-transparent rounded-xl">
                      Đăng nhập
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">
                      Đăng ký miễn phí
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Hero Section - Redesigned */}
        <section className="relative overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/50 via-background to-muted/50" />
          <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div
                className={`space-y-8 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm border border-primary/20">
                  <Zap className="w-4 h-4" />
                  Ứng dụng chăm sóc thú cưng #1 Việt Nam
                </div>

                <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                  Chăm sóc{" "}
                  <span className="text-primary relative">
                    thông minh
                    <svg
                      className="absolute -bottom-2 left-0 w-full"
                      viewBox="0 0 200 8"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M1 5.5C47.6667 2.16667 141 -2.4 199 5.5"
                        stroke="#F15A29"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>{" "}
                  cho thú cưng yêu thương
                </h1>

                <p className="text-lg text-foreground/70 max-w-lg leading-relaxed">
                  AI kiểm tra sức khỏe, quản lý hồ sơ y tế, mua sắm thông minh và đặt dịch vụ - tất cả trong một ứng dụng
                  duy nhất.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    onClick={() => setShowOnboarding(true)}
                    className="bg-primary hover:bg-white text-primary-foreground hover:text-foreground font-bold rounded-2xl px-8 py-6 text-lg w-full sm:w-auto shadow-xl shadow-primary/25 hover:shadow-2xl hover:scale-105 transition-all group border-2 border-primary"
                  >
                    Bắt đầu miễn phí
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="font-bold rounded-2xl px-8 py-6 text-lg w-full sm:w-auto border-2 border-foreground bg-transparent text-foreground hover:bg-primary hover:border-primary hover:text-white group transition-all"
                  >
                    <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                    Xem demo
                  </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 pt-8 border-t border-border/50">
                  {stats.map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <stat.icon className="w-4 h-4 text-primary" />
                        <p className="text-xl lg:text-2xl font-bold text-foreground">{stat.number}</p>
                      </div>
                      <p className="text-xs text-foreground/60">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hero Image */}
              <div
                className={`relative transition-all duration-1000 delay-300 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
              >
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-3xl" />
                <div className="relative">
                  {/* Main Image */}
                  <div className="bg-card rounded-3xl p-2 shadow-2xl">
                    <Image
                      src="/happy-cat-and-dog-pets-app-interface-mockup-colorf.jpg"
                      alt="TailMates App"
                      width={400}
                      height={500}
                      className="rounded-2xl w-full"
                    />
                  </div>

                  {/* Floating Cards */}
                  <div className="absolute -top-4 -right-4 bg-card rounded-2xl p-3 shadow-xl animate-bounce-slow">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">Sức khỏe tốt!</p>
                        <p className="text-xs text-foreground/60">AI phân tích</p>
                      </div>
                    </div>
                  </div>

                  <div className="absolute -bottom-4 -left-4 bg-card rounded-2xl p-3 shadow-xl animate-bounce-slow delay-500">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">Lịch hẹn mới</p>
                        <p className="text-xs text-foreground/60">Spa hôm nay 14:00</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section - Redesigned */}
        <section id="features" className="py-20 lg:py-32 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent font-medium text-sm mb-4">
                <Sparkles className="w-4 h-4" />
                Tính năng nổi bật
              </div>
              <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-4">
                Tất cả những gì bạn cần cho thú cưng
              </h2>
              <p className="text-lg text-foreground/70">
                Từ kiểm tra sức khỏe AI đến mua sắm thông minh, TailMates có đầy đủ tính năng
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <Card
                    key={index}
                    className="group hover:shadow-2xl transition-all duration-500 border-border hover:border-primary/30 hover:-translate-y-2 overflow-hidden"
                  >
                    <CardContent className="p-6 relative">
                      <div
                        className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.color} opacity-10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500`}
                      />
                      <div
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}
                      >
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                      <p className="text-foreground/60 text-sm leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* How It Works Section - NEW */}
        <section id="how-it-works" className="py-20 lg:py-32 bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4">
                <Clock className="w-4 h-4" />
                Đơn giản & Nhanh chóng
              </div>
              <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-4">Bắt đầu chỉ trong 2 phút</h2>
              <p className="text-lg text-foreground/70">
                Không cần phức tạp, chỉ cần vài bước đơn giản để bắt đầu hành trình chăm sóc bé yêu
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              {howItWorks.map((step, index) => (
                <div key={index} className="relative">
                  {index < howItWorks.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                  )}
                  <div className="text-center">
                    <div className="relative inline-flex mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25">
                        <step.icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {step.step}
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
                    <p className="text-foreground/60 text-sm">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section - Enhanced */}
        <section id="testimonials" className="py-20 lg:py-32 bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-foreground font-medium text-sm mb-4">
                <MessageCircle className="w-4 h-4" />
                Đánh giá từ cộng đồng
              </div>
              <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-4">Được yêu thích bởi các Sen</h2>
              <p className="text-lg text-foreground/70">Hàng nghìn người đã tin tưởng TailMates cho thú cưng của họ</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card
                  key={index}
                  className={`border-border transition-all duration-500 hover:shadow-xl hover:-translate-y-1 ${index === activeTestimonial ? "ring-2 ring-primary shadow-xl" : ""
                    }`}
                >
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-foreground/80 mb-6 leading-relaxed italic">"{testimonial.content}"</p>
                    <div className="flex items-center gap-3 pt-4 border-t border-border">
                      <Image
                        src={testimonial.avatar || "/placeholder.svg"}
                        alt={testimonial.name}
                        width={48}
                        height={48}
                        className="rounded-full ring-2 ring-primary/20"
                      />
                      <div>
                        <p className="font-bold text-foreground">{testimonial.name}</p>
                        <p className="text-sm text-foreground/60">{testimonial.pet}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section - Enhanced */}
        <section className="py-20 lg:py-32 bg-gradient-to-r from-navy via-accent to-navy relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white font-medium text-sm mb-6 backdrop-blur-sm">
              <Heart className="w-4 h-4" />
              Miễn phí trọn đời cho 1 thú cưng
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6 text-balance">
              Bắt đầu chăm sóc thú cưng tốt hơn ngay hôm nay
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
              Đăng ký miễn phí và khám phá tất cả tính năng tuyệt vời của TailMates. Không cần thẻ tín dụng.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => setShowOnboarding(true)}
                className="bg-white hover:bg-white/90 text-navy font-bold rounded-2xl px-10 py-6 text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
              >
                <PawPrint className="w-5 h-5 mr-2" />
                Bắt đầu miễn phí
              </Button>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 font-bold rounded-2xl px-10 py-6 text-lg bg-transparent"
                >
                  Đã có tài khoản? Đăng nhập
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer - Enhanced */}
        <footer className="bg-foreground text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8 mb-12">
              <div>
                <p className="text-white/60 text-sm">Nền tảng chăm sóc thú cưng toàn diện với công nghệ AI tiên tiến.</p>
              </div>
              <div>
                <h4 className="font-bold mb-4">Sản phẩm</h4>
                <ul className="space-y-2 text-sm text-white/60">
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Tính năng
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Đối tác
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4">Hỗ trợ</h4>
                <ul className="space-y-2 text-sm text-white/60">
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Trung tâm trợ giúp
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Liên hệ
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      FAQ
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4">Pháp lý</h4>
                <ul className="space-y-2 text-sm text-white/60">
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Điều khoản
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Bảo mật
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Cookie
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-white/50">© 2026 TailMates. Made with love for pets.</p>
              <div className="flex items-center gap-4">
                <a href="https://www.facebook.com/profile.php?id=61581718212794" className="text-white/50 hover:text-white transition-colors">
                  Facebook
                </a>
                <a href="#" className="text-white/50 hover:text-white transition-colors">
                  Instagram
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Onboarding Modal */}
      <OnboardingModal open={showOnboarding} onOpenChange={setShowOnboarding} />
    </>
  )
}
