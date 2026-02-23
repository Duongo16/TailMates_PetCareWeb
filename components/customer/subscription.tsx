import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Loader2, Zap, Crown, PawPrint, Heart, Sparkles, Cat, Dog, CheckCircle2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCustomerPackages } from "@/lib/hooks"
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

export function Subscription() {
  const { data: packages, isLoading } = useCustomerPackages()
  const { user, refreshUser } = useAuth()
  const router = useRouter()
  const [isSubscribing, setIsSubscribing] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    package: any | null;
  }>({
    isOpen: false,
    package: null,
  })
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const featuredRef = useRef<HTMLDivElement>(null)

  // --- Bug 9 Fix: Derive current active subscription info ---
  const activeSub = user?.subscription
  const isSubActive = !!(activeSub?.package_id &&
    activeSub?.expired_at &&
    new Date(activeSub.expired_at) > new Date())

  const isCurrentPackage = (pkgId: string): boolean =>
    isSubActive && activeSub?.package_id?.toString() === pkgId

  const handleSubscribeClick = (pkg: any) => {
    // --- Bug 12 Fix: Skip confirmation dialog for free packages ---
    if (pkg.price === 0) {
      handleFreePackage(pkg)
      return
    }
    setConfirmDialog({ isOpen: true, package: pkg })
  }

  const handleFreePackage = async (pkg: any) => {
    if (isCurrentPackage(pkg._id)) return
    setIsSubscribing(pkg._id)
    try {
      const res = await packagesAPI.subscribeCustomer(pkg._id)
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

    // Check balance
    if ((user?.tm_balance || 0) < pkg.price) {
      toast.error("Số dư TM không đủ để đăng ký gói này.")
      router.push("/top-up")
      return
    }

    // --- Bug 13 Fix: Close dialog and set loading BEFORE API call to prevent double-click ---
    setConfirmDialog({ isOpen: false, package: null })
    setIsSubscribing(pkg._id)

    try {
      const res = await packagesAPI.subscribeCustomer(pkg._id)
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
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  // Auto scroll to featured package on mobile mount
  useEffect(() => {
    if (featuredRef.current && scrollContainerRef.current && packages) {
      const timer = setTimeout(() => {
        featuredRef.current?.scrollIntoView({
          behavior: "auto",
          block: "nearest",
          inline: "center",
        })
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [packages, isLoading])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-140px)] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-foreground/50 animate-pulse font-medium text-sm">Đang tìm quà cho Sen...</p>
      </div>
    )
  }

  const highlightIndex = packages && packages.length > 0 ? Math.floor(packages.length / 2) : -1

  return (
    <div className="min-h-[calc(100vh-110px)] md:min-h-[calc(100vh-140px)] flex flex-col pt-2 sm:pt-6 pb-8 px-0 sm:px-6 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="text-center space-y-1 mb-2 sm:mb-6 flex-shrink-0 px-3">
        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           className="flex justify-center"
        >
          <Badge className="px-3 py-0.5 text-[9px] sm:text-xs bg-primary/10 text-primary border-primary/20 rounded-full font-black uppercase tracking-widest">
            TailMates VIP Membership
          </Badge>
        </motion.div>
        <motion.h1 
          className="text-xl sm:text-3xl md:text-5xl font-black text-navy dark:text-white leading-tight"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Đặc quyền cho <span className="text-primary relative inline-block">
            Bé Yêu
            <motion.div 
              className="absolute -top-3 -right-6 sm:-top-6 sm:-right-10 text-primary rotate-12"
              animate={{ rotate: [12, 25, 12], scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Heart className="w-5 h-5 sm:w-8 sm:h-8 fill-current" />
            </motion.div>
          </span>
        </motion.h1>

        {/* --- Bug 9 Fix: Show current active subscription info in header --- */}
        {isSubActive && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 mt-2"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-xs font-bold border border-green-200 dark:border-green-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Gói đang hoạt động
              <span className="text-green-500 dark:text-green-300">•</span>
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
        <div className="flex md:grid md:grid-cols-3 gap-6 md:gap-4 lg:gap-14 items-center w-max md:w-full max-w-6xl mx-auto md:px-4 py-8 md:py-0">
          {packages?.map((pkg, index) => {
            const isHighlighted = index === highlightIndex
            const isCurrent = isCurrentPackage(pkg._id)
            const isLoadingThis = isSubscribing === pkg._id

            return (
              <motion.div
                key={pkg._id}
                ref={isHighlighted ? featuredRef : null}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative group flex flex-col h-fit snap-center flex-shrink-0 w-[85vw] md:w-full ${
                  isHighlighted 
                    ? "z-20 scale-[1.05] md:scale-[1.1] ring-2 ring-primary/20 rounded-[2.8rem] shadow-[0_20px_50px_rgba(241,90,41,0.15)]" 
                    : "z-10 scale-[0.95] opacity-95 md:opacity-90"
                }`}
              >
                {/* Pet Decor */}
                <div className="absolute inset-0 z-0 pointer-events-none overflow-visible">
                  {index === 0 && (
                    <motion.div 
                      className="absolute -top-10 -left-6 text-primary/30 -rotate-12"
                      animate={{ y: [0, -5, 0], x: [0, 2, 0] }}
                      transition={{ repeat: Infinity, duration: 3 }}
                    >
                      <Cat className="w-12 h-12" />
                    </motion.div>
                  )}
                  {isHighlighted && (
                    <>
                      <motion.div 
                        className="absolute -bottom-8 -right-6 text-primary/50 rotate-12"
                        animate={{ x: [0, 5, 0], y: [0, -2, 0] }}
                        transition={{ repeat: Infinity, duration: 4, delay: 1 }}
                      >
                        <Dog className="w-14 h-14" />
                      </motion.div>
                      <motion.div 
                        className="absolute top-1/2 -left-8 text-accent/30 -translate-y-1/2 rotate-[-90deg]"
                        animate={{ x: [0, 3, 0] }}
                        transition={{ repeat: Infinity, duration: 2.5 }}
                      >
                        <PawPrint className="w-10 h-10" />
                      </motion.div>
                    </>
                  )}
                  {index === 2 && (
                    <motion.div 
                      className="absolute -top-12 -right-4 text-accent/30 rotate-12"
                      animate={{ scale: [1, 1.1, 1], rotate: [12, 15, 12] }}
                      transition={{ repeat: Infinity, duration: 3.5 }}
                    >
                      <Cat className="w-12 h-12" />
                    </motion.div>
                  )}
                </div>

                {/* Pet Ears */}
                <div className={`absolute -top-4 sm:-top-6 inset-x-0 flex justify-center gap-16 sm:gap-24 z-0 opacity-80 group-hover:opacity-100 transition-all duration-300 pointer-events-none`}>
                  <div className={`w-8 sm:w-10 h-8 sm:h-12 rounded-t-full rotate-[-15deg] ${isHighlighted ? "bg-primary shadow-lg" : "bg-accent/40"}`} />
                  <div className={`w-8 sm:w-10 h-8 sm:h-12 rounded-t-full rotate-[15deg] ${isHighlighted ? "bg-primary shadow-lg" : "bg-accent/40"}`} />
                </div>

                {/* Gradient Border */}
                <div className={`absolute -inset-[2px] sm:-inset-[5px] rounded-[2.8rem] z-0 transition-opacity duration-500 ${
                  isCurrent
                    ? "opacity-100 bg-gradient-to-r from-green-400 to-emerald-500 shadow-[0_0_30px_rgba(34,197,94,0.25)]"
                    : isHighlighted 
                      ? "opacity-100 bg-gradient-to-r from-primary via-accent via-white/40 via-primary to-accent bg-[length:300%_100%] animate-gradient-x shadow-[0_0_40px_rgba(241,90,41,0.3)]" 
                      : "opacity-0 group-hover:opacity-100 bg-gradient-to-r from-primary/30 to-accent/30"
                }`} />
                
                <Card 
                  className={`relative z-10 flex flex-col h-full border-none transition-all duration-500 rounded-[2.5rem] shadow-xl overflow-hidden min-h-[400px] md:min-h-fit ${
                    isHighlighted 
                      ? "bg-card" 
                      : "bg-card/95"
                  }`}
                >
                  {/* --- Bug 9 Fix: Current plan badge (takes priority over "most popular") --- */}
                  {isCurrent ? (
                    <div className="absolute top-0 right-0 left-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[10px] sm:text-xs text-center py-1.5 font-black uppercase tracking-widest rounded-t-[2.5rem] flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3" /> Gói đang sử dụng
                    </div>
                  ) : isHighlighted && (
                    <div className="absolute top-0 right-0 left-0 bg-gradient-to-r from-primary via-orange-400 to-primary text-white text-[10px] sm:text-xs text-center py-1.5 font-black uppercase tracking-widest rounded-t-[2.5rem] shadow-sm">
                      ✨ Phổ biến nhất ✨
                    </div>
                  )}
                  
                  <CardHeader className={`p-5 sm:p-7 pb-1 sm:pb-2 ${isCurrent || isHighlighted ? "pt-7 sm:pt-10" : "pt-5 sm:pt-8"}`}>
                    <div className="flex items-center justify-between mb-1 sm:mb-2 text-navy dark:text-white">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-6 ${
                        isCurrent 
                          ? "bg-green-500 text-white shadow-xl shadow-green-500/30 border-none"
                          : isHighlighted 
                            ? "bg-primary text-white shadow-xl shadow-primary/30 border-none" 
                            : "bg-secondary text-primary"
                      }`}>
                         {index === 0 ? <Heart className="w-5 h-5 sm:w-6 sm:h-6 fill-current" /> : isHighlighted ? <Zap className="w-5 h-5 sm:w-6 sm:h-6 fill-current" /> : <Crown className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />}
                      </div>
                      <Badge variant="secondary" className="rounded-full bg-primary/5 text-primary text-[9px] sm:text-xs font-black border-none px-2.5 py-0.5 sm:px-3 sm:py-1">
                        {pkg.duration_months} THÁNG
                      </Badge>
                    </div>
                    <CardTitle className={`font-black tracking-tight ${isHighlighted ? "text-xl sm:text-2xl" : "text-lg sm:text-xl"}`}>{pkg.name}</CardTitle>
                  </CardHeader>

                <CardContent className="p-6 sm:p-8 flex-grow flex flex-col relative z-10">
                  <div className="mb-6 sm:mb-8">
                    <h3 className={`text-xl sm:text-2xl font-black mb-1 sm:mb-2 ${isHighlighted ? "text-primary" : "text-navy dark:text-white"}`}>
                      {pkg.name}
                    </h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl md:text-5xl font-black text-navy dark:text-white">
                        {pkg.price === 0 ? "0đ" : new Intl.NumberFormat("vi-VN").format(pkg.price)}
                      </span>
                      {pkg.price > 0 && (
                        <span className="text-foreground/40 font-bold text-sm sm:text-base">
                          / {pkg.duration_months} tháng
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Limits & Features */}
                  <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 flex-grow">
                    {/* Limits Highlight */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {pkg.features_config?.max_pets && (
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 text-[10px] sm:text-xs">
                          Tối đa {pkg.features_config.max_pets} thú cưng
                        </Badge>
                      )}
                      {pkg.features_config?.ai_limit_per_day && (
                        <Badge variant="outline" className="bg-accent/5 text-accent border-accent/10 text-[10px] sm:text-xs">
                          {pkg.features_config.ai_limit_per_day} lượt AI/ngày
                        </Badge>
                      )}
                    </div>

                    {pkg.benefits?.map((benefit: any, i: number) => (
                      <div key={i} className="flex items-start gap-3 group/item">
                        <div className={`mt-1 p-0.5 rounded-full ${isHighlighted ? "bg-primary/20 text-primary" : "bg-foreground/10 text-foreground/40"}`}>
                          <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </div>
                        <span className={`text-xs sm:text-sm font-medium leading-relaxed ${benefit.is_bold ? "font-bold text-navy dark:text-white" : "text-foreground/70"}`}>
                          {benefit.text || benefit}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* --- Bug 9 Fix: Show expiry for current plan --- */}
                  {isCurrent && activeSub?.expired_at && (
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-green-600 dark:text-green-400 font-bold bg-green-50 dark:bg-green-900/20 px-2.5 py-1 rounded-lg w-fit mt-auto">
                      <Clock className="w-3 h-3" />
                      Hết hạn: {new Date(activeSub.expired_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                    </div>
                  )}
                </CardContent>

                  <CardFooter className="p-5 sm:p-7 pt-2 mt-auto">
                    {/* --- Bug 9 Fix: "Gói hiện tại" label for current package, disable re-subscribe --- */}
                    {/* --- Bug 13 Fix: disabled during loading to prevent double-click --- */}
                    <Button 
                      className={`w-full h-11 sm:h-12 rounded-2xl text-sm sm:text-base font-black transition-all group-active:scale-95 ${
                        isCurrent
                          ? "bg-green-500 text-white cursor-default border-none opacity-90"
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
                      ) : isHighlighted ? "Nâng cấp ngay" : pkg.price === 0 ? "Kích hoạt miễn phí" : "Chọn gói này"}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Mobile Swipe Indicators */}
      <div className="flex md:hidden justify-center gap-2 mb-2 px-3">
        {packages?.map((_, i) => (
          <div 
            key={i} 
            className={`w-1.5 h-1.5 rounded-full transition-all ${i === highlightIndex ? "bg-primary w-4" : "bg-primary/20"}`}
          />
        ))}
      </div>

      {/* Footer info */}
      <div className="text-center mt-auto flex-shrink-0 py-2 border-t border-navy/5 bg-card/10">
        <p className="text-[8px] sm:text-xs text-foreground/30 font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 text-navy dark:text-white/40">
          <Sparkles className="w-3 h-3 text-primary animate-pulse" />
          VIP Experience • An toàn • Bảo mật
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
                <p className="text-sm font-bold text-foreground/60 uppercase tracking-widest mb-1">Gói dịch vụ</p>
                <p className="text-xl font-black text-primary">{confirmDialog.package?.name}</p>
                <p className="text-sm font-bold text-foreground/40 mt-1">{confirmDialog.package?.duration_months} tháng</p>
              </div>

              <div className="flex justify-between items-center px-2">
                <span className="text-sm font-bold text-foreground/60">Giá gói</span>
                <span className="text-lg font-black text-navy">{confirmDialog.package && formatPrice(confirmDialog.package.price)}</span>
              </div>

              <div className="flex justify-between items-center px-2">
                <span className="text-sm font-bold text-foreground/60">Số dư hiện tại</span>
                <span className="text-lg font-black text-primary">{user?.tm_balance?.toLocaleString()} TM</span>
              </div>

              {(user?.tm_balance || 0) >= (confirmDialog.package?.price || 0) && (
                <div className="flex justify-between items-center px-2 pt-1 border-t border-border/50">
                  <span className="text-sm font-bold text-foreground/60">Số dư còn lại</span>
                  <span className="text-lg font-black text-green-600">
                    {((user?.tm_balance || 0) - (confirmDialog.package?.price || 0)).toLocaleString()} TM
                  </span>
                </div>
              )}

              {(user?.tm_balance || 0) < (confirmDialog.package?.price || 0) ? (
                <div className="bg-red-50 text-red-500 rounded-xl p-3 text-xs font-bold border border-red-100 mt-4">
                  ⚠️ Số dư không đủ. Vui lòng nạp thêm Xu để tiếp tục.
                </div>
              ) : (
                <p className="text-xs text-foreground/40 font-medium">
                  Số tiền sẽ được trừ trực tiếp vào ví TailMates của bạn.
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
              // --- Bug 13 Fix: Disabled while isSubscribing to prevent double-click ---
              <AlertDialogAction
                className="w-full sm:w-1/2 h-12 rounded-2xl bg-primary text-white font-black shadow-lg shadow-primary/20 m-0 disabled:opacity-50 disabled:cursor-not-allowed"
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
