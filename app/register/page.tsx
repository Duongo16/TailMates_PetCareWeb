"use client"

import type React from "react"

import { useState } from "react"
import { useAuth, type UserRole } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Eye, EyeOff, ArrowLeft, PawPrint, User, Store, CheckCircle2, Sparkles, Shield, Gift } from "lucide-react"
import { cn } from "@/lib/utils"

export default function RegisterPage() {
  const { register } = useAuth()
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState<UserRole>("customer")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp")
      return
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự")
      return
    }

    setIsLoading(true)

    const result = await register(name, email, password, role)

    if (result.success) {
      router.push(`/dashboard/${role}`)
    } else {
      setError(result.error || "Đã có lỗi xảy ra")
    }

    setIsLoading(false)
  }

  const roleOptions = [
    {
      id: "customer" as UserRole,
      label: "Khách hàng",
      description: "Quản lý thú cưng, mua sắm và đặt dịch vụ",
      icon: User,
      benefits: ["AI kiểm tra sức khỏe", "Quản lý hồ sơ y tế", "Ưu đãi độc quyền"],
    },
    {
      id: "merchant" as UserRole,
      label: "Đối tác kinh doanh",
      description: "Bán sản phẩm và cung cấp dịch vụ",
      icon: Store,
      benefits: ["Tiếp cận 10K+ khách hàng", "Dashboard phân tích", "Hoa hồng thấp 5%"],
    },
  ]

  const customerBenefits = [
    { icon: Sparkles, text: "AI kiểm tra sức khỏe miễn phí" },
    { icon: Shield, text: "Hồ sơ y tế số bảo mật" },
    { icon: Gift, text: "Ưu đãi 15% đơn hàng đầu tiên" },
  ]

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary via-accent to-navy items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-lg text-center text-white">
          <div className="mb-8">
            <Image
              src="/cute-happy-pets-welcome-illustration-colorful.jpg"
              alt="Welcome Pets"
              width={280}
              height={280}
              className="mx-auto drop-shadow-2xl animate-float"
            />
          </div>

          <h2 className="text-4xl font-bold mb-4">Tham gia TailMates</h2>
          <p className="text-white/80 text-lg mb-8">
            Hơn 10,000 Sen đã tin tưởng TailMates để chăm sóc thú cưng của mình
          </p>

          <div className="space-y-3 text-left bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
            {customerBenefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <benefit.icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-white/90">{benefit.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-12 xl:px-20 bg-card overflow-y-auto py-8">
        <div className="w-full max-w-md mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-foreground/60 hover:text-primary mb-6 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Về trang chủ
          </Link>

          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="px-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25">
                  <PawPrint className="w-7 h-7 text-white" />
                </div>
                <Image src="/images/avarta.png" alt="TailMates" width={120} height={40} className="h-10 w-auto" />
              </div>
              <CardTitle className="text-3xl font-bold text-foreground">Tạo tài khoản</CardTitle>
              <CardDescription className="text-foreground/60 text-base">
                Đăng ký miễn phí và bắt đầu chăm sóc bé cưng
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Role Selection - Enhanced */}
                <div className="space-y-3">
                  <Label className="text-foreground font-medium">Bạn là</Label>
                  <div className="grid grid-cols-1 gap-3">
                    {roleOptions.map((option) => {
                      const Icon = option.icon
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setRole(option.id)}
                          className={cn(
                            "p-4 rounded-xl border-2 text-left transition-all",
                            role === option.id
                              ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                              : "border-border hover:border-primary/50 hover:bg-secondary/50",
                          )}
                        >
                          <div className="flex items-start gap-4">
                            <div
                              className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
                                role === option.id
                                  ? "bg-gradient-to-br from-primary to-primary/70 text-white shadow-lg shadow-primary/25"
                                  : "bg-secondary text-foreground",
                              )}
                            >
                              <Icon className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="font-bold text-foreground">{option.label}</p>
                                {role === option.id && <CheckCircle2 className="w-5 h-5 text-primary" />}
                              </div>
                              <p className="text-sm text-foreground/60 mt-1">{option.description}</p>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground font-medium">
                    Họ và tên
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-xl h-12 bg-background border-border focus:border-primary"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-xl h-12 bg-background border-border focus:border-primary"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground font-medium">
                    Mật khẩu
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Ít nhất 6 ký tự"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="rounded-xl h-12 pr-12 bg-background border-border focus:border-primary"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-foreground font-medium">
                    Xác nhận mật khẩu
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Nhập lại mật khẩu"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="rounded-xl h-12 bg-background border-border focus:border-primary"
                    required
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 font-bold text-base shadow-lg shadow-primary/25 hover:shadow-xl transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang tạo tài khoản...
                    </span>
                  ) : (
                    "Đăng ký miễn phí"
                  )}
                </Button>

                <p className="text-xs text-center text-foreground/50">
                  Bằng việc đăng ký, bạn đồng ý với{" "}
                  <a href="#" className="text-primary hover:underline">
                    Điều khoản sử dụng
                  </a>{" "}
                  và{" "}
                  <a href="#" className="text-primary hover:underline">
                    Chính sách bảo mật
                  </a>
                </p>
              </form>

              <p className="mt-6 text-center text-foreground/60">
                Đã có tài khoản?{" "}
                <Link href="/login" className="text-primary font-semibold hover:underline">
                  Đăng nhập
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
