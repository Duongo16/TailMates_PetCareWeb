"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  PawPrint,
  Sparkles,
  ShoppingBag,
  Calendar,
  Shield,
  Heart,
  Star,
  CheckCircle2,
  Play,
  ArrowRight,
  Zap,
  Users,
  Award,
  Clock,
  MessageCircle,
  Store,
} from "lucide-react"
import { useState, useEffect, useRef, useCallback } from "react"
import { motion, useScroll, useTransform, useInView, useMotionValue, useSpring } from "framer-motion"
import { useCustomerPackages, useMerchantPackages } from "@/lib/hooks"
import { OnboardingModal } from "@/components/onboarding-modal"
import { SiteHeader } from "@/components/site-header"
import { useAuth } from "@/lib/auth-context"

// ===== 3D Helper Components =====

function FloatingParticles() {
  const particles = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    size: Math.random() * 6 + 3,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 5,
    duration: Math.random() * 4 + 6,
    isPaw: i % 4 === 0,
  }))
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className={`absolute rounded-full ${p.isPaw ? "text-primary/20" : "bg-primary/10"}`}
          style={{
            width: p.isPaw ? p.size * 3 : p.size,
            height: p.isPaw ? p.size * 3 : p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        >
          {p.isPaw ? <PawPrint className="w-full h-full animate-wave-float" style={{ animationDelay: `${p.delay}s` }} /> : (
            <div className="w-full h-full rounded-full animate-particle" style={{ animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s` }} />
          )}
        </div>
      ))}
    </div>
  )
}



function useTilt3D() {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 200, damping: 20 })
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { stiffness: 200, damping: 20 })

  const handleMouse = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    x.set((e.clientX - rect.left) / rect.width - 0.5)
    y.set((e.clientY - rect.top) / rect.height - 0.5)
  }, [x, y])

  const handleLeave = useCallback(() => { x.set(0); y.set(0) }, [x, y])

  return { ref, rotateX, rotateY, handleMouse, handleLeave }
}

// Animated counter component
function AnimatedCounter({ value, suffix = "" }: { value: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })
  return (
    <span ref={ref} className="inline-block">
      <motion.span
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {value}{suffix}
      </motion.span>
    </span>
  )
}

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
  const { user } = useAuth()
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  const { data: customerPackages } = useCustomerPackages()
  const { data: merchantPackages } = useMerchantPackages()

  const pricingPlans = [
    ...(customerPackages || []).map((pkg: any) => ({
      name: pkg.name,
      price: pkg.price === 0 ? "Miễn phí" : new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(pkg.price),
      period: pkg.price === 0 ? "" : pkg.duration_months === 1 ? "/tháng" : `/${pkg.duration_months} tháng`,
      features: Array.isArray(pkg.benefits) ? pkg.benefits.map((b: any) => b.text || b) : [],
      popular: pkg.price > 0 && pkg.price < 200000,
      cta: "Bắt đầu ngay",
      role: "CUSTOMER",
      rawPrice: pkg.price,
      limits: pkg.features_config,
    })),
    ...(merchantPackages || []).map((pkg: any) => ({
      name: pkg.name,
      price: pkg.price === 0 ? "Miễn phí" : new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(pkg.price),
      period: pkg.price === 0 ? "" : pkg.duration_months === 1 ? "/tháng" : `/${pkg.duration_months} tháng`,
      features: Array.isArray(pkg.benefits) ? pkg.benefits.map((b: any) => b.text || b) : [],
      popular: false,
      cta: "Đăng ký đối tác",
      role: "MERCHANT",
      rawPrice: pkg.price,
      limits: pkg.features_config,
    }))
  ]

  // Bug fix: sort using rawPrice (number), not the formatted VND string
  const finalPricingPlans = pricingPlans.length > 0 ? pricingPlans.sort((a, b) => {
    if (a.role !== b.role) return a.role === "CUSTOMER" ? -1 : 1
    return (a.rawPrice ?? 0) - (b.rawPrice ?? 0)
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

  const heroTilt = useTilt3D()

  return (
    <>
      <div className="min-h-screen bg-background overflow-hidden">
        {/* Header */}
        <SiteHeader />

        {/* Hero Section - 3D Immersive */}
        <section className="relative overflow-hidden min-h-[90vh] flex items-center">
          {/* Animated Background with particles */}
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/50 via-background to-muted/50" />
          <FloatingParticles />
          <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 w-full">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -60 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="space-y-8"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm border border-primary/20"
                >
                  <Zap className="w-4 h-4 animate-pulse" />
                  Ứng dụng chăm sóc thú cưng #1 Việt Nam
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="text-4xl lg:text-6xl font-bold leading-tight"
                >
                  <span className="text-foreground">Bạn đồng hành</span>{" "}
                  <span className="gradient-text relative inline-block">
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8, type: "spring", bounce: 0.5 }}
                    >
                      siêu dễ thương
                    </motion.span>
                    <motion.span
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.3, type: "spring", bounce: 0.6 }}
                      className="inline-block ml-2 text-3xl lg:text-5xl"
                    >
                      🐾
                    </motion.span>
                    <motion.svg
                      className="absolute -bottom-2 left-0 w-full"
                      viewBox="0 0 200 8"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ delay: 1.2, duration: 0.8 }}
                    >
                      <motion.path
                        d="M1 5.5C47.6667 2.16667 141 -2.4 199 5.5"
                        stroke="#F15A29"
                        strokeWidth="3"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: 1.2, duration: 0.8 }}
                      />
                    </motion.svg>
                  </span>
                  <br />
                  <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="text-foreground text-3xl lg:text-5xl"
                  >
                    cho boss yêu của bạn ✨
                  </motion.span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-lg text-foreground/70 max-w-lg leading-relaxed"
                >
                  Nền tảng chăm sóc thú cưng <span className="font-bold text-primary">All-in-One</span> dành cho các Sen yêu thú cưng 🐶🐱 — AI kiểm tra sức khỏe, hồ sơ y tế, mua sắm thông minh & đặt dịch vụ, tất cả trong một app!
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex flex-col sm:flex-row gap-4"
                >
                  {!user && (
                    <Button
                      size="lg"
                      onClick={() => setShowOnboarding(true)}
                      className="bg-primary hover:bg-white text-primary-foreground hover:text-foreground font-bold rounded-2xl px-8 py-6 text-lg w-full sm:w-auto shadow-xl shadow-primary/25 hover:shadow-2xl hover:scale-105 transition-all group border-2 border-primary"
                    >
                      Bắt đầu miễn phí
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  )}
                  <Button
                    size="lg"
                    variant="outline"
                    className="font-bold rounded-2xl px-8 py-6 text-lg w-full sm:w-auto border-2 border-foreground bg-transparent text-foreground hover:bg-primary hover:border-primary hover:text-white group transition-all"
                  >
                    <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                    Xem demo
                  </Button>
                </motion.div>

                {/* Stats with animated counters */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="grid grid-cols-4 gap-4 pt-8 border-t border-border/50"
                >
                  {stats.map((stat, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9 + index * 0.1 }}
                      className="text-center group cursor-default"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <stat.icon className="w-4 h-4 text-primary group-hover:scale-125 transition-transform" />
                        <p className="text-xl lg:text-2xl font-bold text-foreground">
                          <AnimatedCounter value={stat.number} />
                        </p>
                      </div>
                      <p className="text-xs text-foreground/60">{stat.label}</p>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>

              {/* Hero Image - 3D Flying Pets from Phone */}
              <motion.div
                initial={{ opacity: 0, x: 60, rotateY: -15 }}
                animate={{ opacity: 1, x: 0, rotateY: 0 }}
                transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                className="relative perspective-2000"
                onMouseMove={heroTilt.handleMouse}
                onMouseLeave={heroTilt.handleLeave}
                ref={heroTilt.ref}
              >
                <motion.div
                  style={{ rotateX: heroTilt.rotateX, rotateY: heroTilt.rotateY }}
                  className="preserve-3d relative"
                >
                  {/* Glow behind the phone */}
                  <div className="absolute -inset-8 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-[50px]" />

                  {/* Main phone image with pets flying out */}
                  <div className="relative">
                    <motion.div
                      className="relative z-10"
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Image
                        src="/flying-pets-3d.png"
                        alt="Thú cưng bay ra từ điện thoại - TailMates App"
                        width={550}
                        height={550}
                        className="w-full drop-shadow-2xl"
                        priority
                      />
                    </motion.div>

                    {/* Pet emoji accents - entrance only, no infinite loop */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1, duration: 0.5, type: "spring" }}
                      className="absolute -top-6 -right-2 text-5xl drop-shadow-lg"
                    >
                      🐕
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.2, duration: 0.5, type: "spring" }}
                      className="absolute -top-2 -left-6 text-5xl drop-shadow-lg"
                    >
                      🐈
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.4, duration: 0.5, type: "spring" }}
                      className="absolute top-1/4 -right-8 text-4xl drop-shadow-lg"
                    >
                      🐦
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.6, duration: 0.5, type: "spring" }}
                      className="absolute bottom-1/4 -left-6 text-4xl drop-shadow-lg"
                    >
                      🐹
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.8, duration: 0.5, type: "spring" }}
                      className="absolute -bottom-4 right-1/4 text-4xl drop-shadow-lg"
                    >
                      🐠
                    </motion.div>

                    {/* Single sparkle accent */}
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 2 }}
                      className="absolute top-1/3 -right-4 text-2xl"
                    >
                      ✨
                    </motion.span>

                    {/* Floating cards around the phone */}
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute -bottom-6 -left-4 bg-card/90 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-white/20 z-20"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">Sức khỏe tốt! 💚</p>
                          <p className="text-xs text-foreground/60">AI phân tích</p>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                      className="absolute -bottom-6 -right-4 bg-accent/90 backdrop-blur-md rounded-2xl p-3 shadow-xl text-white z-20"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        <p className="text-xs font-bold">AI Scan 🔍</p>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section - 3D Cards */}
        <section id="features" className="py-20 lg:py-32 bg-background relative">
          <div className="absolute top-20 left-0 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto mb-16"
            >
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
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 perspective-2000">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 40, rotateX: 15 }}
                    whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.15, duration: 0.6 }}
                  >
                    <Card className="group tilt-card hover:shadow-2xl border-border hover:border-primary/30 overflow-hidden h-full">
                      <CardContent className="p-6 relative">
                        <div
                          className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.color} opacity-10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-[2] transition-transform duration-700`}
                        />
                        <div
                          className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}
                        >
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{feature.title}</h3>
                        <p className="text-foreground/60 text-sm leading-relaxed">{feature.description}</p>
                        {/* Shine effect on hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>

        {/* How It Works Section - 3D Timeline */}
        <section id="how-it-works" className="py-20 lg:py-32 bg-card relative overflow-hidden">

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center max-w-3xl mx-auto mb-16"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4">
                <Clock className="w-4 h-4 animate-spin-slow" />
                Đơn giản & Nhanh chóng
              </div>
              <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-4">Bắt đầu chỉ trong 2 phút</h2>
              <p className="text-lg text-foreground/70">
                Không cần phức tạp, chỉ cần vài bước đơn giản để bắt đầu hành trình chăm sóc bé yêu
              </p>
            </motion.div>

            <div className="grid md:grid-cols-4 gap-8 perspective-1000">
              {howItWorks.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50, rotateY: -20 }}
                  whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2, duration: 0.7 }}
                  className="relative"
                >
                  {index < howItWorks.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 overflow-hidden">
                      <div className="w-full h-full bg-gradient-to-r from-primary/50 to-transparent" />

                    </div>
                  )}
                  <div className="text-center group">
                    <div className="relative inline-flex mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25 group-hover:shadow-primary/50 group-hover:scale-110 transition-all duration-500">
                        <step.icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {step.step}
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{step.title}</h3>
                    <p className="text-foreground/60 text-sm">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section - 3D Cards */}
        <section id="testimonials" className="py-20 lg:py-32 bg-card relative overflow-hidden">

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center max-w-3xl mx-auto mb-16"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-foreground font-medium text-sm mb-4">
                <MessageCircle className="w-4 h-4" />
                Đánh giá từ cộng đồng
              </div>
              <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-4">Được yêu thích bởi các Sen</h2>
              <p className="text-lg text-foreground/70">Hàng nghìn người đã tin tưởng TailMates cho thú cưng của họ</p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 perspective-1000">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, rotateY: 30, x: 40 }}
                  whileInView={{ opacity: 1, rotateY: 0, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2, duration: 0.7 }}
                >
                  <Card
                    className={`tilt-card border-border transition-all duration-500 hover:shadow-xl overflow-hidden ${index === activeTestimonial ? "ring-2 ring-primary shadow-xl scale-[1.02]" : ""}`}
                  >
                    <CardContent className="p-6 relative">
                      <div className="flex gap-1 mb-4">
                        {Array.from({ length: testimonial.rating }).map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.2 + i * 0.1 }}
                          >
                            <Star className="w-5 h-5 fill-primary text-primary" />
                          </motion.div>
                        ))}
                      </div>
                      <p className="text-foreground/80 mb-6 leading-relaxed italic">"{testimonial.content}"</p>
                      <div className="flex items-center gap-3 pt-4 border-t border-border">
                        <Image
                          src={testimonial.avatar || "/placeholder.svg"}
                          alt={testimonial.name}
                          width={48}
                          height={48}
                          className="rounded-full ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all"
                        />
                        <div>
                          <p className="font-bold text-foreground">{testimonial.name}</p>
                          <p className="text-sm text-foreground/60">{testimonial.pet}</p>
                        </div>
                      </div>
                      {/* Subtle shine on active */}
                      {index === activeTestimonial && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-shimmer pointer-events-none" />
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 lg:py-32 bg-secondary/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center max-w-3xl mx-auto mb-16 lg:mb-24"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-sm mb-6 uppercase tracking-wider">
                <Zap className="w-4 h-4 animate-pulse" />
                Gói dịch vụ
              </div>
              <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-4 leading-tight">Lựa chọn gói phù hợp với bạn</h2>
              <p className="text-lg text-foreground/70">Nâng tầm trải nghiệm chăm sóc thú cưng với các tính năng độc quyền</p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 gap-y-12 perspective-1000">
              {finalPricingPlans.map((plan: any, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 40, rotateX: 10 }}
                  whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.12, duration: 0.6 }}
                  className="h-full flex flex-col"
                >
                  <Card className={`h-full border-none shadow-xl flex flex-col relative transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 rounded-[2.5rem] overflow-hidden group ${plan.popular ? "ring-2 ring-primary/20 bg-card z-10 shadow-primary/10" : "bg-card/80 backdrop-blur-sm"}`}>
                    {plan.popular && (
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black px-4 py-1.5 rounded-b-xl uppercase tracking-widest shadow-lg">
                        Phổ biến nhất
                      </div>
                    )}
                    <CardHeader className="p-8 pb-4">
                      <div className="flex justify-between items-start mb-6">
                        <div className={`p-3 rounded-2xl ${plan.role === "CUSTOMER" ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"}`}>
                          {plan.role === "CUSTOMER" ? <Heart className="w-6 h-6" /> : <Store className="w-6 h-6" />}
                        </div>
                        <Badge variant="outline" className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${plan.role === "CUSTOMER" ? "bg-green-50/50 text-green-600 border-green-200" : "bg-blue-50/50 text-blue-600 border-blue-200"}`}>
                          {plan.role === "CUSTOMER" ? "Khách hàng" : "Đối tác"}
                        </Badge>
                      </div>
                      <h3 className="text-2xl font-black text-foreground mb-2">{plan.name}</h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-primary">{plan.price}</span>
                        {plan.period && <span className="text-foreground/40 font-bold text-sm tracking-wide">{plan.period}</span>}
                      </div>
                    </CardHeader>
                    <CardContent className="px-8 py-4 flex-grow">
                      <div className="flex flex-wrap gap-2 mb-8">
                        {plan.limits?.max_pets && (
                          <div className="bg-primary/5 text-primary text-[10px] font-black px-3 py-1.5 rounded-xl border border-primary/10 flex items-center gap-1.5">
                            <PawPrint className="w-3.5 h-3.5" />
                            {plan.limits.max_pets} Thú cưng
                          </div>
                        )}
                        {plan.limits?.ai_limit_per_day && (
                          <div className="bg-accent/5 text-accent text-[10px] font-black px-3 py-1.5 rounded-xl border border-accent/10 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            {plan.limits.ai_limit_per_day} Lượt AI/ngày
                          </div>
                        )}
                      </div>
                      <ul className="space-y-4">
                        {plan.features.slice(0, 6).map((feature: string, fIndex: number) => (
                          <li key={fIndex} className="flex items-start gap-3 group">
                            <div className="mt-1 p-0.5 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-foreground/70 text-sm font-medium leading-relaxed">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <div className="p-8 pt-4 mt-auto">
                      <Button 
                        onClick={() => window.location.href = "/register"}
                        className={`w-full py-7 rounded-2xl font-black text-base shadow-lg transition-all active:scale-[0.98] ${plan.popular ? "bg-primary hover:bg-primary/90 shadow-primary/25" : "bg-secondary text-primary hover:bg-primary hover:text-white shadow-secondary/20"}`}>
                        {plan.cta}
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section - Aurora Gradient */}
        <section className="py-20 lg:py-32 bg-gradient-to-r from-navy via-accent to-navy relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-navy via-accent/80 to-primary/30" />
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/15 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/15 rounded-full blur-3xl" />

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
          >
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
              {!user && (
                <>
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
                </>
              )}
            </div>
          </motion.div>
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
