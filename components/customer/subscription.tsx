import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Loader2, Zap, Crown, PawPrint, Heart, Sparkles, Cat, Dog } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCustomerPackages } from "@/lib/hooks"
import { packagesAPI } from "@/lib/api"
import { motion, AnimatePresence } from "framer-motion"

export function Subscription() {
  const { data: packages, isLoading } = useCustomerPackages()
  const [isSubscribing, setIsSubscribing] = useState<string | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const featuredRef = useRef<HTMLDivElement>(null)

  const handleSubscribe = async (packageId: string) => {
    setIsSubscribing(packageId)
    try {
      const res = await packagesAPI.subscribeCustomer(packageId)
      if (res.success && res.data) {
        if ((res.data as any).payment_url) {
          window.location.href = (res.data as any).payment_url
        } else {
          alert("Đăng ký thành công!")
        }
      } else {
        alert(res.message || "Đăng ký thất bại")
      }
    } catch {
      alert("Lỗi kết nối hệ thống")
    } finally {
      setIsSubscribing(null)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  // Auto scroll to featured package on mobile mount - Faster focus
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
    <div className="h-[calc(100vh-110px)] md:h-[calc(100vh-140px)] flex flex-col pt-2 sm:pt-6 pb-2 px-0 sm:px-6 max-w-7xl mx-auto overflow-hidden">
      {/* Header section - Extremely compact on mobile */}
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
      </div>

      {/* Pricing Cards - Scrollable on mobile, Fixed on desktop */}
      <div 
        ref={scrollContainerRef}
        className="flex-grow flex overflow-x-auto md:overflow-hidden snap-x snap-mandatory scrollbar-none md:flex md:items-center md:justify-center py-2 md:py-4 px-6 md:px-0"
      >
        <div className="flex md:grid md:grid-cols-3 gap-6 md:gap-4 lg:gap-14 items-center w-max md:w-full max-w-6xl mx-auto md:px-4 py-8 md:py-0">
          {packages?.map((pkg, index) => {
            const isHighlighted = index === highlightIndex
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
                {/* Pet Decor - Climbing pets */}
                <div className="absolute inset-0 z-0 pointer-events-none overflow-visible">
                  {/* Climbing/Peeking Pets based on index */}
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
                {/* Pet Ears Decor */}
                <div className={`absolute -top-4 sm:-top-6 inset-x-0 flex justify-center gap-16 sm:gap-24 z-0 opacity-80 group-hover:opacity-100 transition-all duration-300 pointer-events-none`}>
                  <div className={`w-8 sm:w-10 h-8 sm:h-12 rounded-t-full rotate-[-15deg] ${isHighlighted ? "bg-primary shadow-lg" : "bg-accent/40"}`} />
                  <div className={`w-8 sm:w-10 h-8 sm:h-12 rounded-t-full rotate-[15deg] ${isHighlighted ? "bg-primary shadow-lg" : "bg-accent/40"}`} />
                </div>

                {/* Animated Gradient Border Frame */}
                <div className={`absolute -inset-[2px] sm:-inset-[5px] rounded-[2.8rem] z-0 transition-opacity duration-500 ${
                  isHighlighted 
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
                  {isHighlighted && (
                    <div className="absolute top-0 right-0 left-0 bg-gradient-to-r from-primary via-orange-400 to-primary text-white text-[10px] sm:text-xs text-center py-1.5 font-black uppercase tracking-widest rounded-t-[2.5rem] shadow-sm">
                      ✨ Phổ biến nhất ✨
                    </div>
                  )}
                  
                  <CardHeader className={`p-5 sm:p-7 pb-1 sm:pb-2 ${isHighlighted ? "pt-7 sm:pt-10" : "pt-5 sm:pt-8"}`}>
                    <div className="flex items-center justify-between mb-1 sm:mb-2 text-navy dark:text-white">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-6 ${isHighlighted ? "bg-primary text-white shadow-xl shadow-primary/30 border-none" : "bg-secondary text-primary"}`}>
                         {index === 0 ? <Heart className="w-5 h-5 sm:w-6 sm:h-6 fill-current" /> : isHighlighted ?  <Zap className="w-5 h-5 sm:w-6 sm:h-6 fill-current" /> : <Crown className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />}
                      </div>
                      <Badge variant="secondary" className="rounded-full bg-primary/5 text-primary text-[9px] sm:text-xs font-black border-none px-2.5 py-0.5 sm:px-3 sm:py-1">
                        {pkg.duration_months} THÁNG
                      </Badge>
                    </div>
                    <CardTitle className={`font-black tracking-tight ${isHighlighted ? "text-xl sm:text-2xl" : "text-lg sm:text-xl"}`}>{pkg.name}</CardTitle>
                  </CardHeader>

                  <CardContent className="p-5 sm:p-7 pt-0 flex-grow space-y-4 text-navy dark:text-white/80">
                    <div className="flex items-baseline gap-1">
                      <span className={`font-black text-primary ${isHighlighted ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"}`}>
                        {formatPrice(pkg.price).split(",")[0]}
                      </span>
                      <span className="text-foreground/40 text-[10px] sm:text-xs font-bold">/ {pkg.duration_months}th</span>
                    </div>

                    <div className="space-y-2.5 text-navy dark:text-white/80">
                      <p className="text-[10px] sm:text-[11px] font-black text-foreground/40 uppercase tracking-widest flex items-center gap-2">
                        <PawPrint className="w-3.5 h-3.5 text-primary" /> Quyền lợi:
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
                        className={`w-full h-11 sm:h-12 rounded-2xl text-sm sm:text-base font-black transition-all group-active:scale-95 ${
                          isHighlighted 
                            ? "bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02] border-none" 
                            : "bg-secondary text-primary hover:bg-primary hover:text-white border-none"
                        }`}
                        onClick={() => handleSubscribe(pkg._id)}
                        disabled={isSubscribing === pkg._id}
                      >
                        {isSubscribing === pkg._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          isHighlighted ? "Nâng cấp ngay" : "Chọn gói này"
                        )}
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

      {/* Footer info - Fixed at bottom */}
      <div className="text-center mt-auto flex-shrink-0 py-2 border-t border-navy/5 bg-card/10">
        <p className="text-[8px] sm:text-xs text-foreground/30 font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 text-navy dark:text-white/40">
          <Sparkles className="w-3 h-3 text-primary animate-pulse" />
          VIP Experience • An toàn • Bảo mật
          <Sparkles className="w-3 h-3 text-primary animate-pulse" />
        </p>
      </div>
    </div>
  )
}
