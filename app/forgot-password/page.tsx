"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, PawPrint, Mail, KeyRound, ShieldCheck, Eye, EyeOff, CheckCircle2 } from "lucide-react"
import { FadeIn } from "@/components/ui/motion-wrappers"
import { authAPI } from "@/lib/api"

type Step = "email" | "otp" | "reset" | "success"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown])

  // === Step 1: Send OTP ===
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await authAPI.forgotPasswordSendOtp(email)

      if (response.success) {
        setStep("otp")
        setCountdown(response.data?.waitSeconds || 60)
      } else {
        if (response.retryAfter) {
          setCountdown(response.retryAfter)
        }
        setError(response.message || "Không thể gửi OTP")
      }
    } catch {
      setError("Lỗi kết nối. Vui lòng thử lại.")
    }

    setIsLoading(false)
  }

  // === Step 2: Verify OTP ===
  const handleVerifyOtp = async (e?: React.FormEvent, otpOverride?: string) => {
    e?.preventDefault()
    setError("")
    const otpValue = otpOverride || otp.join("")

    if (otpValue.length !== 6) {
      setError("Vui lòng nhập đầy đủ 6 chữ số OTP")
      return
    }

    setIsLoading(true)

    try {
      const response = await authAPI.forgotPasswordVerifyOtp(email, otpValue)

      if (response.success) {
        setStep("reset")
      } else {
        setError(response.message || "Mã OTP không hợp lệ")
      }
    } catch {
      setError("Lỗi kết nối. Vui lòng thử lại.")
    }

    setIsLoading(false)
  }

  // === Step 3: Reset Password ===
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp")
      return
    }

    setIsLoading(true)

    try {
      const response = await authAPI.forgotPasswordReset(email, newPassword)

      if (response.success) {
        setStep("success")
      } else {
        setError(response.message || "Không thể đặt lại mật khẩu")
      }
    } catch {
      setError("Lỗi kết nối. Vui lòng thử lại.")
    }

    setIsLoading(false)
  }

  // Resend OTP
  const handleResendOtp = async () => {
    if (countdown > 0) return
    setError("")
    setIsLoading(true)

    try {
      const response = await authAPI.forgotPasswordSendOtp(email)

      if (response.success) {
        setCountdown(response.data?.waitSeconds || 60)
        setOtp(["", "", "", "", "", ""])
      } else {
        if (response.retryAfter) {
          setCountdown(response.retryAfter)
        }
        setError(response.message || "Không thể gửi lại OTP")
      }
    } catch {
      setError("Lỗi kết nối. Vui lòng thử lại.")
    }

    setIsLoading(false)
  }

  // OTP input handler
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all filled - pass OTP directly to avoid stale state
    const otpString = newOtp.join("")
    if (newOtp.every((v) => v) && otpString.length === 6) {
      setTimeout(() => {
        handleVerifyOtp(undefined, otpString)
      }, 200)
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (pastedData.length === 0) return

    const newOtp = [...otp]
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i]
    }
    setOtp(newOtp)

    // Focus appropriate input
    const nextIndex = Math.min(pastedData.length, 5)
    otpInputRefs.current[nextIndex]?.focus()

    // Auto-submit if all filled - pass OTP directly to avoid stale state
    const otpString = newOtp.join("")
    if (newOtp.every((v) => v)) {
      setTimeout(() => {
        handleVerifyOtp(undefined, otpString)
      }, 200)
    }
  }

  const stepConfig = {
    email: {
      icon: Mail,
      title: "Quên mật khẩu",
      description: "Nhập email đã đăng ký để nhận mã xác thực",
    },
    otp: {
      icon: ShieldCheck,
      title: "Nhập mã OTP",
      description: `Mã xác thực đã được gửi đến ${email}`,
    },
    reset: {
      icon: KeyRound,
      title: "Đặt lại mật khẩu",
      description: "Nhập mật khẩu mới cho tài khoản của bạn",
    },
    success: {
      icon: CheckCircle2,
      title: "Thành công!",
      description: "Mật khẩu đã được đặt lại. Bạn có thể đăng nhập với mật khẩu mới.",
    },
  }

  const currentStep = stepConfig[step]
  const StepIcon = currentStep.icon

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-12 xl:px-20 bg-card">
        <div className="w-full max-w-md mx-auto">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-foreground/60 hover:text-primary mb-8 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Quay lại đăng nhập
          </Link>

          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="px-0">
              <FadeIn delay={0.1}>
                <div className="flex items-center gap-3 mb-6">
                  <motion.div
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25"
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <PawPrint className="w-7 h-7 text-white" />
                  </motion.div>
                  <Image src="/images/logo-ngang.png" alt="TailMates" width={120} height={40} className="sm:h-16 h-8 w-auto" />
                </div>
              </FadeIn>

              {/* Step indicator */}
              <FadeIn delay={0.15}>
                <div className="flex items-center gap-2 mb-6">
                  {(["email", "otp", "reset"] as const).map((s, i) => (
                    <div key={s} className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                          step === s
                            ? "bg-primary text-white shadow-lg shadow-primary/30"
                            : step === "success" ||
                              (s === "email" && (step === "otp" || step === "reset")) ||
                              (s === "otp" && step === "reset")
                            ? "bg-green-500 text-white"
                            : "bg-secondary text-foreground/40"
                        }`}
                      >
                        {(step === "success" ||
                          (s === "email" && (step === "otp" || step === "reset")) ||
                          (s === "otp" && step === "reset")) ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          i + 1
                        )}
                      </div>
                      {i < 2 && (
                        <div
                          className={`w-8 h-0.5 transition-all ${
                            (s === "email" && (step === "otp" || step === "reset" || step === "success")) ||
                            (s === "otp" && (step === "reset" || step === "success"))
                              ? "bg-green-500"
                              : "bg-secondary"
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </FadeIn>

              <FadeIn delay={0.2}>
                <div className="flex items-center gap-3 mb-2">
                  <StepIcon className={`w-6 h-6 ${step === "success" ? "text-green-500" : "text-primary"}`} />
                  <CardTitle className="text-2xl font-bold text-foreground">{currentStep.title}</CardTitle>
                </div>
              </FadeIn>
              <FadeIn delay={0.3}>
                <CardDescription className="text-foreground/60 text-base">
                  {currentStep.description}
                </CardDescription>
              </FadeIn>
            </CardHeader>

            <CardContent className="px-0">
              <AnimatePresence mode="wait">
                {/* Step 1: Email */}
                {step === "email" && (
                  <motion.div
                    key="email"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <form onSubmit={handleSendOtp} className="space-y-5">
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
                          autoFocus
                        />
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
                            Đang gửi...
                          </span>
                        ) : (
                          "Gửi mã xác thực"
                        )}
                      </Button>
                    </form>
                  </motion.div>
                )}

                {/* Step 2: OTP */}
                {step === "otp" && (
                  <motion.div
                    key="otp"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <form onSubmit={handleVerifyOtp} className="space-y-5">
                      <div className="space-y-3">
                        <Label className="text-foreground font-medium">Mã OTP</Label>
                        <div className="flex gap-2 justify-center">
                          {otp.map((digit, index) => (
                            <input
                              key={index}
                              ref={(el) => { otpInputRefs.current[index] = el }}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => handleOtpChange(index, e.target.value)}
                              onKeyDown={(e) => handleOtpKeyDown(index, e)}
                              onPaste={index === 0 ? handleOtpPaste : undefined}
                              className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                              autoFocus={index === 0}
                            />
                          ))}
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
                        disabled={isLoading || otp.join("").length !== 6}
                      >
                        {isLoading ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Đang xác thực...
                          </span>
                        ) : (
                          "Xác thực OTP"
                        )}
                      </Button>

                      <div className="text-center">
                        {countdown > 0 ? (
                          <p className="text-sm text-foreground/50">
                            Gửi lại OTP sau <span className="font-semibold text-primary">{countdown}s</span>
                          </p>
                        ) : (
                          <button
                            type="button"
                            onClick={handleResendOtp}
                            className="text-sm text-primary hover:underline font-medium"
                            disabled={isLoading}
                          >
                            Gửi lại mã OTP
                          </button>
                        )}
                      </div>
                    </form>
                  </motion.div>
                )}

                {/* Step 3: New Password */}
                {step === "reset" && (
                  <motion.div
                    key="reset"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <form onSubmit={handleResetPassword} className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="newPassword" className="text-foreground font-medium">
                          Mật khẩu mới
                        </Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showPassword ? "text" : "password"}
                            placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="rounded-xl h-12 pr-12 bg-background border-border focus:border-primary focus:ring-primary"
                            required
                            autoFocus
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
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Nhập lại mật khẩu mới"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="rounded-xl h-12 pr-12 bg-background border-border focus:border-primary focus:ring-primary"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors"
                          >
                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
                            Đang đặt lại...
                          </span>
                        ) : (
                          "Đặt lại mật khẩu"
                        )}
                      </Button>
                    </form>
                  </motion.div>
                )}

                {/* Step 4: Success */}
                {step === "success" && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="text-center space-y-6"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                      className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto"
                    >
                      <CheckCircle2 className="w-10 h-10 text-green-500" />
                    </motion.div>

                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        Đặt lại mật khẩu thành công!
                      </h3>
                      <p className="text-foreground/60">
                        Bạn có thể đăng nhập bằng mật khẩu mới.
                      </p>
                    </div>

                    <Button
                      onClick={() => router.push("/login")}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 font-bold text-base shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
                    >
                      Đăng nhập ngay
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
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

          <h2 className="text-4xl font-bold mb-4">Khôi phục tài khoản</h2>
          <p className="text-white/80 text-lg mb-8">
            Đừng lo, chúng tôi sẽ giúp bạn lấy lại quyền truy cập tài khoản một cách nhanh chóng và an toàn.
          </p>

          <div className="text-left space-y-3 bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
            {[
              "Nhập email đã đăng ký",
              "Xác thực bằng mã OTP",
              "Tạo mật khẩu mới an toàn",
            ].map((text, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {index + 1}
                </div>
                <span className="text-white/90">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
