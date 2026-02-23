"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Loader2, Crown, Store, Building, Zap, BarChart, Sparkles, CheckCircle2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useMerchantPackages } from "@/lib/hooks"
import { packagesAPI } from "@/lib/api"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const PACKAGE_ICONS = [Store, Building, Crown]

export function MerchantSubscription() {
  const { data: packages, isLoading } = useMerchantPackages()
  const { user, refreshUser } = useAuth()
  const router = useRouter()
  const [isSubscribing, setIsSubscribing] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    package: any | null;
  }>({ isOpen: false, package: null })

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const featuredRef = useRef<HTMLDivElement>(null)

  // Derive active subscription state
  const activeSub = user?.subscription
  const isSubActive = !!(activeSub?.package_id &&
    activeSub?.expired_at &&
    new Date(activeSub.expired_at) > new Date())

  const isCurrentPackage = (pkgId: string): boolean =>
    isSubActive && activeSub?.package_id?.toString() === pkgId

  const handleSubscribeClick = (pkg: any) => {
    if (isCurrentPackage(pkg._id)) return
    if (pkg.price === 0) {
      handleFreePackage(pkg)
      return
    }
    setConfirmDialog({ isOpen: true, package: pkg })
  }

  const handleFreePackage = async (pkg: any) => {
    setIsSubscribing(pkg._id)
    try {
      const res = await packagesAPI.subscribeMerchant(pkg._id)
      if (res.success) {
        toast.success("Đã kích hoạt gói miễn phí!")
        await refreshUser()
      } else {
        toast.error(res.message || "Kích hoạt thất bại")
      }
    } catch {
      toast.error("Lỗi kết nối hệ thống")
    } finally {
      setIsSubscribing(null)
    }
  }

  const handleConfirmSubscribe = async () => {
    const pkg = confirmDialog.package
    if (!pkg) return

    if ((user?.tm_balance || 0) < pkg.price) {
      toast.error("Số dư TM không đủ.")
      router.push("/top-up")
      return
    }

    // Close dialog and set loading before API call to prevent double-click
    setConfirmDialog({ isOpen: false, package: null })
    setIsSubscribing(pkg._id)

    try {
      const res = await packagesAPI.subscribeMerchant(pkg._id)
      if (res.success) {
        toast.success(`Đăng ký gói ${pkg.name} thành công!`)
        await refreshUser()
      } else {
        toast.error(res.message || "Đăng ký thất bại")
      }
    } catch {
      toast.error("Lỗi kết nối hệ thống")
    } finally {
      setIsSubscribing(null)
    }
  }

  const formatPrice = (price: number) => {
    if (price === 0) return "Miễn phí"
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price)
  }

  // Auto-scroll to featured (middle) card on mobile
  const highlightIndex = packages && packages.length > 0 ? Math.floor(packages.length / 2) : -1

  useEffect(() => {
    if (featuredRef.current && scrollContainerRef.current && packages) {
      const timer = setTimeout(() => {
        featuredRef.current?.scrollIntoView({ behavior: "auto", block: "nearest", inline: "center" })
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [packages, isLoading])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-140px)] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-foreground/50 animate-pulse font-medium text-sm">Đang tải gói đối tác...</p>
      </div>
    )
  }

  if (!packages || packages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-140px)] gap-4 text-center px-6">
        <Store className="w-14 h-14 text-primary/30" />
        <p className="text-foreground/50 font-medium">Chưa có gói Merchant nào. Vui lòng liên hệ quản trị viên.</p>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-110px)] md:min-h-[calc(100vh-140px)] flex flex-col pt-2 sm:pt-6 pb-8 px-0 sm:px-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-1 mb-2 sm:mb-6 flex-shrink-0 px-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex justify-center"
        >
          <Badge className="px-3 py-0.5 text-[9px] sm:text-xs bg-primary/10 text-primary border-primary/20 rounded-full font-black uppercase tracking-widest">
            TailMates Merchant Partner
          </Badge>
        </motion.div>
        <motion.h1
          className="text-xl sm:text-3xl md:text-5xl font-black text-navy dark:text-white leading-tight"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Gói <span className="text-primary">Đối Tác</span> Thương Mại
        </motion.h1>
        <motion.p
          className="text-xs sm:text-sm text-foreground/50 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Mở khóa tính năng cao cấp để phát triển cửa hàng của bạn
        </motion.p>

        {/* Active subscription banner */}
        {isSubActive && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 mt-2"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-xs font-bold border border-green-200 dark:border-green-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Gói đang hoạt động
              <span className="text-green-500">•</span>
              <Clock className="w-3 h-3" />
              hết hạn {new Date(activeSub!.expired_at!).toLocaleDateString("vi-VN")}
            </div>
          </motion.div>
        )}
      </div>

      <div
        ref={scrollContainerRef}
        className="flex-grow flex overflow-x-auto snap-x snap-mandatory scrollbar-none md:flex md:items-center md:justify-center py-2 md:py-4 px-6 md:px-0"
      >
        <div className="flex md:grid md:grid-cols-3 gap-6 md:gap-4 lg:gap-10 items-center w-max md:w-full max-w-6xl mx-auto md:px-4 py-8 md:py-0">
          {packages.map((pkg: any, index: number) => {
            const isHighlighted = index === highlightIndex
            const isCurrent = isCurrentPackage(pkg._id)
            const isLoadingThis = isSubscribing === pkg._id
            const Icon = PACKAGE_ICONS[index % PACKAGE_ICONS.length]

            return (
              <motion.div
                key={pkg._id}
                ref={isHighlighted ? featuredRef : null}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative group flex flex-col h-fit snap-center flex-shrink-0 w-[85vw] md:w-full ${
                  isHighlighted
                    ? "z-20 scale-[1.05] md:scale-[1.1]"
                    : "z-10 scale-[0.95] opacity-95 md:opacity-90"
                }`}
              >
                {/* Gradient border */}
                <div className={`absolute -inset-[2px] sm:-inset-[4px] rounded-[2.8rem] z-0 transition-opacity duration-500 ${
                  isCurrent
                    ? "opacity-100 bg-gradient-to-r from-green-400 to-emerald-500 shadow-[0_0_30px_rgba(34,197,94,0.25)]"
                    : isHighlighted
                      ? "opacity-100 bg-gradient-to-r from-primary via-orange-400 to-primary bg-[length:300%_100%] animate-gradient-x shadow-[0_0_40px_rgba(241,90,41,0.3)]"
                      : "opacity-0 group-hover:opacity-100 bg-gradient-to-r from-primary/30 to-accent/30"
                }`} />

                <Card className={`relative z-10 flex flex-col h-full border-none rounded-[2.5rem] shadow-xl overflow-hidden min-h-[380px] md:min-h-fit transition-all duration-500 ${
                  isHighlighted ? "bg-card" : "bg-card/95"
                }`}>
                  {/* Top banner */}
                  {isCurrent ? (
                    <div className="absolute top-0 right-0 left-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[10px] sm:text-xs text-center py-1.5 font-black uppercase tracking-widest rounded-t-[2.5rem] flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3" /> Gói đang sử dụng
                    </div>
                  ) : isHighlighted ? (
                    <div className="absolute top-0 right-0 left-0 bg-gradient-to-r from-primary via-orange-400 to-primary text-white text-[10px] sm:text-xs text-center py-1.5 font-black uppercase tracking-widest rounded-t-[2.5rem]">
                      ⚡ Phổ biến nhất ⚡
                    </div>
                  ) : null}

                  <CardHeader className={`p-5 sm:p-7 pb-1 sm:pb-2 ${isCurrent || isHighlighted ? "pt-7 sm:pt-10" : "pt-5 sm:pt-8"}`}>
                    <div className="flex items-center justify-between mb-1 sm:mb-2">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-6 ${
                        isCurrent
                          ? "bg-green-500 text-white shadow-xl shadow-green-500/30"
                          : isHighlighted
                            ? "bg-primary text-white shadow-xl shadow-primary/30"
                            : "bg-secondary text-primary"
                      }`}>
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <Badge variant="secondary" className="rounded-full bg-primary/5 text-primary text-[9px] sm:text-xs font-black border-none px-2.5 py-0.5">
                        {pkg.duration_months} THÁNG
                      </Badge>
                    </div>
                    <CardTitle className={`font-black tracking-tight ${isHighlighted ? "text-xl sm:text-2xl" : "text-lg sm:text-xl"}`}>
                      {pkg.name}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="p-5 sm:p-7 pt-0 flex-grow space-y-4">
                    <div className="flex items-baseline gap-1">
                      <span className={`font-black text-primary ${isHighlighted ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"}`}>
                        {pkg.price === 0 ? "Miễn phí" : formatPrice(pkg.price).split(",")[0]}
                      </span>
                      {pkg.price > 0 && (
                        <span className="text-foreground/40 text-[10px] sm:text-xs font-bold">/ {pkg.duration_months}th</span>
                      )}
                    </div>

                    {/* Expiry for current plan */}
                    {isCurrent && activeSub?.expired_at && (
                      <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-green-600 font-bold bg-green-50 dark:bg-green-900/20 px-2.5 py-1 rounded-lg">
                        <Clock className="w-3 h-3" />
                        Hết hạn: {new Date(activeSub.expired_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                      </div>
                    )}

                    {/* Limits Highlight */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {pkg.features_config?.max_pets && (
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 text-[10px] sm:text-xs">
                          Tối đa {pkg.features_config.max_pets} thú cưng
                        </Badge>
                      )}
                      {pkg.features_config?.unlimited_products && (
                        <Badge variant="outline" className="bg-green-50 text-green-600 border-green-100 text-[10px] sm:text-xs">
                          Không giới hạn sản phẩm
                        </Badge>
                      )}
                      {pkg.features_config?.qr_scanning && (
                        <Badge variant="outline" className="bg-accent/5 text-accent border-accent/10 text-[10px] sm:text-xs">
                          Quét mã QR
                        </Badge>
                      )}
                      {pkg.features_config?.ai_limit_per_day && (
                        <Badge variant="outline" className="bg-accent/5 text-accent border-accent/10 text-[10px] sm:text-xs">
                          {pkg.features_config.ai_limit_per_day} lượt AI/ngày
                        </Badge>
                      )}
                    </div>

                    {/* Commission info */}
                    {pkg.commission_rate !== undefined && (
                      <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-primary font-bold bg-primary/5 px-2.5 py-1 rounded-lg">
                        <BarChart className="w-3 h-3" />
                        Hoa hồng: {(pkg.commission_rate * 100).toFixed(0)}%
                      </div>
                    )}

                    {/* Benefits list */}
                    <div className="space-y-2.5">
                      <p className="text-[10px] sm:text-[11px] font-black text-foreground/40 uppercase tracking-widest flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-primary" /> Quyền lợi:
                      </p>
                      <ul className="space-y-2">
                        {pkg.benefits?.map((benefit: any, bIndex: number) => (
                          <li key={bIndex} className="flex items-start gap-2.5">
                            <Check className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${isHighlighted ? "text-primary" : "text-green-500"} stroke-[4px]`} />
                            <span className={`text-[11px] sm:text-xs leading-tight ${benefit.is_bold ? "font-black text-foreground" : "text-foreground/70"} ${benefit.color === "orange" ? "text-orange-600" : ""}`}>
                              {benefit.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>

                  <CardFooter className="p-5 sm:p-7 pt-2 mt-auto">
                    <Button
                      className={`w-full h-11 sm:h-12 rounded-2xl text-sm sm:text-base font-black transition-all ${
                        isCurrent
                          ? "bg-green-500 text-white cursor-default border-none"
                          : isHighlighted
                            ? "bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02] border-none"
                            : "bg-secondary text-primary hover:bg-primary hover:text-white border-none"
                      }`}
                      onClick={() => !isCurrent && handleSubscribeClick(pkg)}
                      disabled={isLoadingThis || isCurrent}
                    >
                      {isLoadingThis ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isCurrent ? (
                        <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Gói hiện tại</span>
                      ) : pkg.price === 0 ? "Kích hoạt miễn phí" : isHighlighted ? "Nâng cấp ngay" : "Chọn gói này"}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Mobile dots */}
      <div className="flex md:hidden justify-center gap-2 mb-2">
        {packages.map((_: any, i: number) => (
          <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === highlightIndex ? "bg-primary w-4" : "bg-primary/20"}`} />
        ))}
      </div>

      {/* Footer */}
      <div className="text-center mt-auto flex-shrink-0 py-2 border-t border-navy/5">
        <p className="text-[8px] sm:text-xs text-foreground/30 font-bold uppercase tracking-widest flex items-center justify-center gap-1.5">
          <Sparkles className="w-3 h-3 text-primary animate-pulse" />
          Đối tác tin cậy • An toàn • Bảo mật
          <Sparkles className="w-3 h-3 text-primary animate-pulse" />
        </p>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={confirmDialog.isOpen}
        onOpenChange={(open) => !open && setConfirmDialog({ ...confirmDialog, isOpen: false })}
      >
        <AlertDialogContent className="rounded-[32px] border-none shadow-2xl p-8 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black text-navy text-center">
              Xác nhận đăng ký
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center pt-4 space-y-4">
              <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
                <p className="text-sm font-bold text-foreground/60 uppercase tracking-widest mb-1">Gói đối tác</p>
                <p className="text-xl font-black text-primary">{confirmDialog.package?.name}</p>
                <p className="text-sm font-bold text-foreground/40 mt-1">{confirmDialog.package?.duration_months} tháng</p>
              </div>

              <div className="flex justify-between items-center px-2">
                <span className="text-sm font-bold text-foreground/60">Giá gói</span>
                <span className="text-lg font-black text-navy">
                  {confirmDialog.package && formatPrice(confirmDialog.package.price)}
                </span>
              </div>

              <div className="flex justify-between items-center px-2">
                <span className="text-sm font-bold text-foreground/60">Số dư TM</span>
                <span className="text-lg font-black text-primary">{user?.tm_balance?.toLocaleString()} TM</span>
              </div>

              {(user?.tm_balance || 0) >= (confirmDialog.package?.price || 0) && (
                <div className="flex justify-between items-center px-2 pt-1 border-t border-border/50">
                  <span className="text-sm font-bold text-foreground/60">Còn lại</span>
                  <span className="text-lg font-black text-green-600">
                    {((user?.tm_balance || 0) - (confirmDialog.package?.price || 0)).toLocaleString()} TM
                  </span>
                </div>
              )}

              {(user?.tm_balance || 0) < (confirmDialog.package?.price || 0) ? (
                <div className="bg-red-50 text-red-500 rounded-xl p-3 text-xs font-bold border border-red-100">
                  ⚠️ Số dư không đủ. Vui lòng nạp thêm để tiếp tục.
                </div>
              ) : (
                <p className="text-xs text-foreground/40 font-medium">
                  Số tiền sẽ được trừ vào ví TailMates của bạn.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-3 pt-6">
            <AlertDialogCancel className="w-full sm:w-1/2 h-12 rounded-2xl border-none bg-secondary text-primary font-black m-0">
              Hủy bỏ
            </AlertDialogCancel>
            {(user?.tm_balance || 0) < (confirmDialog.package?.price || 0) ? (
              <Button
                className="w-full sm:w-1/2 h-12 rounded-2xl bg-primary text-white font-black shadow-lg shadow-primary/20"
                onClick={() => router.push("/top-up")}
              >
                Nạp thêm Xu
              </Button>
            ) : (
              <AlertDialogAction
                className="w-full sm:w-1/2 h-12 rounded-2xl bg-primary text-white font-black shadow-lg shadow-primary/20 m-0 disabled:opacity-50"
                onClick={handleConfirmSubscribe}
                disabled={!!isSubscribing}
              >
                {isSubscribing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Xác nhận thanh toán"}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
