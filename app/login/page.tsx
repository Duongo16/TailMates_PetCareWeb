"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Eye, EyeOff, ArrowLeft, PawPrint, Sparkles, Shield, CheckCircle2, Star } from "lucide-react"

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    const result = await login(email, password)

    if (result.success) {
      const savedUser = localStorage.getItem("tailmates_user")
      if (savedUser) {
        const user = JSON.parse(savedUser)
        router.push(`/dashboard/${user.role}`)
      }
    } else {
      setError(result.error || "Đã có lỗi xảy ra")
    }

    setIsLoading(false)
  }

  const demoAccounts = [
    { email: "customer@tailmates.com", label: "Khách hàng", role: "customer", icon: PawPrint },
    { email: "merchant@tailmates.com", label: "Đối tác", role: "merchant", icon: Shield },
    { email: "manager@tailmates.com", label: "Quản lý", role: "manager", icon: Star },
    { email: "admin@tailmates.com", label: "Admin", role: "admin", icon: Sparkles },
  ]

  const benefits = [
    "AI kiểm tra sức khỏe thú cưng",
    "Quản lý hồ sơ y tế số",
    "Mua sắm với gợi ý thông minh",
    "Đặt lịch dịch vụ nhanh chóng",
  ]

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-12 xl:px-20 bg-card">
        <div className="w-full max-w-md mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-foreground/60 hover:text-primary mb-8 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Về trang chủ
          </Link>

          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="px-0">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25">
                  <PawPrint className="w-7 h-7 text-white" />
                </div>
                <Image src="/images/avarta.png" alt="TailMates" width={120} height={40} className="h-10 w-auto" />
              </div>
              <CardTitle className="text-3xl font-bold text-foreground">Chào mừng trở lại!</CardTitle>
              <CardDescription className="text-foreground/60 text-base">
                Đăng nhập để tiếp tục chăm sóc bé cưng của bạn
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <form onSubmit={handleSubmit} className="space-y-5">
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
                    className="rounded-xl h-12 bg-background border-border focus:border-primary focus:ring-primary"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-foreground font-medium">
                      Mật khẩu
                    </Label>
                    <a href="#" className="text-sm text-primary hover:underline">
                      Quên mật khẩu?
                    </a>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Nhập mật khẩu"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="rounded-xl h-12 pr-12 bg-background border-border focus:border-primary focus:ring-primary"
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

                {error && (
                  <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 font-bold text-base shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang đăng nhập...
                    </span>
                  ) : (
                    "Đăng nhập"
                  )}
                </Button>
              </form>

              <div className="mt-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-card text-foreground/50">Tài khoản demo</span>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {demoAccounts.map((account) => {
                    const Icon = account.icon
                    return (
                      <button
                        key={account.email}
                        type="button"
                        onClick={() => {
                          setEmail(account.email)
                          setPassword("123456")
                        }}
                        className="p-3 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-secondary hover:border-primary/30 transition-all text-left group"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                            <Icon className="w-4 h-4 text-primary" />
                          </div>
                          <span>{account.label}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
                <p className="text-xs text-foreground/40 mt-3 text-center">Mật khẩu: 123456</p>
              </div>

              <p className="mt-8 text-center text-foreground/60">
                Chưa có tài khoản?{" "}
                <Link href="/register" className="text-primary font-semibold hover:underline">
                  Đăng ký miễn phí
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-navy via-accent to-primary items-center justify-center p-12 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-lg text-center text-white">
          <div className="mb-8">
            <Image
              src="/cute-happy-cat-and-dog-illustration-cartoon-style.jpg"
              alt="Pets"
              width={280}
              height={280}
              className="mx-auto drop-shadow-2xl animate-float"
            />
          </div>

          <h2 className="text-4xl font-bold mb-4">Chào mừng đến TailMates</h2>
          <p className="text-white/80 text-lg mb-8">
            Nền tảng chăm sóc thú cưng toàn diện với AI thông minh, giúp bạn yêu thương và chăm sóc bé cưng tốt hơn mỗi
            ngày.
          </p>

          {/* Benefits list */}
          <div className="text-left space-y-3 bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span className="text-white/90">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
