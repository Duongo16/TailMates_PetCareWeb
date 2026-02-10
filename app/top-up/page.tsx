"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { usePaymentStatus } from "@/hooks/usePaymentStatus";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, QrCode, CheckCircle2, Copy, Check, MessageSquareText, Target, Zap, Headphones } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { paymentAPI } from "@/lib/api";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CUSTOMER_TABS } from "@/lib/customer-constants";
import { MERCHANT_TABS } from "@/lib/merchant-constants";
import { DashboardShell } from "@/components/dashboard/shell";

const TOP_UP_OPTIONS = [
  { amount: 10000, label: "10,000" },
  { amount: 20000, label: "20,000" },
  { amount: 50000, label: "50,000" },
  { amount: 100000, label: "100,000" },
  { amount: 200000, label: "200,000" },
  { amount: 500000, label: "500,000" },
];

export default function TopUpPage() {
  const { user, refreshUser, isLoading } = useAuth();
  const router = useRouter();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const [transaction, setTransaction] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const { status } = usePaymentStatus(transaction?.transaction_id, {
    enabled: !!transaction?.transaction_id,
    onSuccess: async () => {
      toast.success("Nạp xu thành công! Đang cập nhật số dư...");
      await refreshUser();
    },
  });

  useEffect(() => {
    if (status === "SUCCESS") {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            if (user?.role === "merchant") {
              router.push("/dashboard/merchant");
            } else {
              router.push("/dashboard/customer");
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [status, router, user?.role]);

  const handleCreateQR = async () => {
    const amount = selectedAmount || parseInt(customAmount);
    if (!amount || amount < 1000) {
      toast.error("Số tiền tối thiểu là 1,000đ");
      return;
    }

    try {
      setIsCreating(true);
      const result = await paymentAPI.createQR({
        type: "TOP_UP",
        amount: amount,
      });

      if (!result.success) throw new Error(result.message || "Không thể tạo mã QR");

      setTransaction(result.data);
      // Auto scroll to QR on mobile
      if (window.innerWidth < 1024) {
        setTimeout(() => {
          document.getElementById('qr-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Đã sao chép!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTabChange = (tabId: string) => {
    const dashboardPath = user?.role === "merchant" ? "/dashboard/merchant" : "/dashboard/customer"
    router.push(`${dashboardPath}?tab=${tabId}`)
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-secondary">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user || !["customer", "merchant"].includes(user.role)) {
    return (
      <div className="h-screen bg-white flex flex-col font-sans">
        <div className="flex-1 flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full text-center">
            <h1 className="text-3xl font-bold text-slate-900 mb-4">Truy cập hạn chế</h1>
            <p className="text-slate-500 mb-8">Vui lòng đăng nhập với quyền Khách hàng hoặc Đối tác để sử dụng tính năng Nạp tiền.</p>
            {!user && (
              <Button onClick={() => window.location.href = "/login"} className="w-full h-12 rounded-xl bg-[#FF5722] hover:bg-[#E64A19] text-white font-bold">
                Đăng nhập ngay
              </Button>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  const tabs = user.role === "merchant" ? MERCHANT_TABS : CUSTOMER_TABS;

  return (
    <DashboardShell tabs={tabs as any} activeTab="" onTabChange={handleTabChange}>
      <div className="flex flex-col font-sans selection:bg-[#FF5722]/10 bg-[#f8fafc]">
        <div className="flex items-center justify-center py-4 md:py-10 px-4">
          <div className="max-w-6xl w-full flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">
            
            {/* RIGHT SIDE: Floating QR Card */}
            <motion.div 
              id="qr-section"
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "w-full flex items-center justify-center lg:justify-end order-1 lg:order-2",
                !transaction && "hidden lg:flex"
              )}
            >
              <Card className="w-full lg:max-w-[440px] bg-white rounded-[32px] md:rounded-[48px] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.12)] border-none overflow-hidden p-6 md:p-10">
                  <div className="flex flex-col items-center gap-6 md:gap-8">
                      {!transaction ? (
                        <div className="flex flex-col items-center text-center py-16 md:py-24 gap-6 opacity-20">
                          <div className="bg-slate-50 w-24 h-24 md:w-32 md:h-32 rounded-[28px] md:rounded-[40px] flex items-center justify-center border-2 border-dashed border-slate-200">
                            <QrCode className="h-12 w-12 md:h-16 md:w-16 stroke-[1]" />
                          </div>
                          <p className="text-xs md:text-sm font-black uppercase tracking-[0.2em] text-[#2d3561]">Đang đợi lệnh nạp</p>
                        </div>
                      ) : status === "SUCCESS" ? (
                        <motion.div 
                          initial={{ scale: 0.9, opacity: 0 }} 
                          animate={{ scale: 1, opacity: 1 }}
                          className="flex flex-col items-center text-center py-6 md:py-10 gap-6"
                        >
                          <div className="bg-[#4CAF50]/10 w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-[#4CAF50] border-2 border-[#4CAF50]/20">
                            <CheckCircle2 className="h-10 w-10 md:h-12 md:w-12" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">Nạp tiền thành công!</h3>
                            <p className="text-sm md:text-base text-slate-500 font-medium">Bạn đã nhận được <span className="text-[#FF5722] font-black">{transaction.amount.toLocaleString()} TM</span></p>
                            <div className="inline-flex items-center gap-2 bg-slate-100 px-4 py-1.5 rounded-full mt-4">
                                <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
                                <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider">Chuyển hướng sau {countdown}s</p>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            className="text-slate-400 font-bold hover:text-[#FF5722] mt-4 hover:bg-[#FF5722]/5 rounded-xl" 
                            onClick={() => setTransaction(null)}
                          >
                            Thực hiện giao dịch khác
                          </Button>
                        </motion.div>
                      ) : (
                        <div className="w-full flex flex-col items-center gap-6">
                          {/* Status Header */}
                          <div className="flex items-center gap-3 bg-orange-50 px-4 py-2 rounded-full border border-orange-100">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF9800] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF9800]"></span>
                              </span>
                              <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-[#FF9800]">Chờ thanh toán</span>
                          </div>

                          {/* Recipient Info Section */}
                          <div className="w-full bg-slate-50 rounded-3xl p-5 border border-slate-100 flex flex-col gap-3">
                              <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-400">
                                  <span>Người thụ hưởng</span>
                                  <Badge className="bg-white text-[#FF5722] border-[#FF5722]/20 text-[9px] h-5 px-2 font-black shadow-sm">{transaction.bank_name}</Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                  <div className="space-y-1 min-w-0">
                                      <div className="text-[12px] font-black text-slate-800 leading-none truncate opacity-60 uppercase">{transaction.account_name}</div>
                                      <div className="text-[18px] md:text-[20px] font-mono font-black text-[#FF5722] tracking-normal leading-none truncate">
                                          {transaction.account_number}
                                      </div>
                                  </div>
                                  <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-10 w-10 shrink-0 text-slate-400 hover:text-[#FF5722] hover:bg-[#FF5722]/10 rounded-xl"
                                      onClick={() => copyToClipboard(transaction.account_number)}
                                  >
                                      <Copy className="h-4 w-4" />
                                  </Button>
                              </div>
                          </div>

                          {/* QR Code Container */}
                          <div className="relative bg-white rounded-[40px] p-5 md:p-6 shadow-2xl border border-slate-100 ring-8 ring-slate-50/50">
                              <div className="w-[200px] xs:w-[240px] md:w-[280px] aspect-square relative">
                                  <Image 
                                      src={transaction.qr_code_url} 
                                      alt="Payment QR Code" 
                                      fill
                                      className="object-contain"
                                      priority
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
                              </div>
                          </div>

                          {/* Transaction Details */}
                          <div className="w-full space-y-5">
                              <div className="flex flex-col items-center gap-1">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Số tiền chính xác</span>
                                  <div className="text-4xl md:text-5xl font-black text-slate-900 flex items-baseline gap-1">
                                      {transaction.amount.toLocaleString()}
                                      <span className="text-sm font-black opacity-20 uppercase">vnd</span>
                                  </div>
                              </div>
                              
                              <div className="bg-slate-900 rounded-[24px] p-4 flex justify-between items-center group/id border border-white/10 shadow-xl shadow-slate-900/20">
                                  <div className="flex flex-col min-w-0">
                                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Nội dung chuyển khoản</span>
                                      <span className="font-mono font-black text-white tracking-widest text-[15px] md:text-[17px] truncate">
                                          {transaction.transaction_code}
                                      </span>
                                  </div>
                                  <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-12 w-12 shrink-0 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
                                      onClick={() => copyToClipboard(transaction.transaction_code)}
                                  >
                                      {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                                  </Button>
                              </div>
                          </div>

                          {/* Security Footer */}
                          <div className="flex items-center gap-3 opacity-20 pt-2 font-black">
                              <span className="text-[10px] uppercase tracking-[0.3em]">SECURED BY SEPAY</span>
                          </div>
                        </div>
                      )}
                  </div>
              </Card>
            </motion.div>

            {/* LEFT SIDE: Amount Selection */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col gap-6 md:gap-10 w-full order-2 lg:order-1"
            >
              <div className="space-y-3 text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 bg-[#FF5722]/10 text-[#FF5722] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                      TailMates Wallet
                  </div>
                  <h1 className="text-4xl md:text-5xl font-black text-[#1a1a1a] tracking-tight leading-[1.1]">Nạp Xu<br />Hệ Sinh Thái</h1>
                  <p className="text-sm md:text-lg text-slate-500 font-medium max-w-md">Nạp Xu để trải nghiệm trọn vẹn các dịch vụ cao cấp nhất dành cho thú cưng của bạn.</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {TOP_UP_OPTIONS.map((opt) => (
                  <button
                    key={opt.amount}
                    onClick={() => {
                      setSelectedAmount(opt.amount);
                      setCustomAmount("");
                    }}
                    className={cn(
                      "p-5 md:p-8 rounded-[28px] md:rounded-[36px] border-4 transition-all duration-500 flex flex-col items-center justify-center gap-2 group relative overflow-hidden",
                      selectedAmount === opt.amount 
                        ? "border-[#FF5722] bg-white shadow-2xl shadow-[#FF5722]/20 -translate-y-1" 
                        : "border-transparent bg-white hover:border-slate-100 text-slate-600 shadow-sm"
                    )}
                  >
                    <div className="flex items-baseline gap-0.5 md:gap-1">
                      <span className={cn(
                        "text-xl md:text-3xl font-black transition-all duration-500",
                        selectedAmount === opt.amount ? "text-[#FF5722] scale-110" : "text-slate-800"
                      )}>{opt.label}</span>
                      <span className={cn(
                        "text-[10px] md:text-xs font-black uppercase opacity-40",
                        selectedAmount === opt.amount ? "text-[#FF5722]" : "text-slate-400"
                      )}>đ</span>
                    </div>
                    {selectedAmount === opt.amount && (
                      <div className="absolute top-0 right-0 p-2">
                        <div className="bg-[#FF5722] text-white p-1 rounded-full">
                          <Check className="w-3 h-3 stroke-[4]" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                  <Label htmlFor="custom-amount" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Hoặc nhập số tiền tự chọn</Label>
                  <div className="relative group">
                      <Input
                          id="custom-amount"
                          type="number"
                          placeholder="Tối thiểu 10,000..."
                          value={customAmount}
                          onChange={(e) => {
                              setCustomAmount(e.target.value);
                              setSelectedAmount(null);
                          }}
                          className="h-16 md:h-20 rounded-[28px] md:rounded-[32px] border-none bg-white shadow-inner shadow-slate-200/50 px-8 text-xl md:text-2xl font-black placeholder:text-slate-300 focus-visible:ring-4 focus-visible:ring-[#FF5722]/10 transition-all"
                      />
                      <div className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-300 font-black text-sm md:text-lg">VNĐ</div>
                  </div>
              </div>

              <div className="space-y-8">
                  <Button 
                      className="w-full h-16 md:h-20 text-xl md:text-2xl font-black rounded-[28px] md:rounded-[32px] bg-[#FF5722] hover:bg-[#FF7043] shadow-[0_20px_40px_-10px_rgba(255,87,34,0.3)] transition-all duration-500 active:scale-[0.96] py-8 border-b-8 border-orange-700" 
                      onClick={handleCreateQR} 
                      disabled={isCreating || (!selectedAmount && !customAmount)}
                  >
                      {isCreating ? (
                          <><Loader2 className="mr-3 h-8 w-8 animate-spin" />Đang tạo mã...</>
                      ) : (
                          transaction ? "Đổi số tiền nạp" : "Tiến hành nạp Xu"
                      )}
                  </Button>

                  <div className="bg-white/50 backdrop-blur-sm rounded-[32px] md:rounded-[40px] p-6 md:p-8 space-y-6 border border-white">
                      <div className="flex items-center gap-3">
                          <div className="h-[3px] w-8 bg-[#FF5722] rounded-full"></div>
                          <h2 className="text-[12px] md:text-sm font-black uppercase tracking-[0.2em] text-slate-600">Quy trình nạp tự động</h2>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                              {
                                  icon: <MessageSquareText className="h-5 w-5" />,
                                  title: "Nội dung chuyển",
                                  desc: "Copy chính xác mã giao dịch."
                              },
                              {
                                  icon: <Target className="h-5 w-5" />,
                                  title: "Số tiền khớp",
                                  desc: "Chuyển đúng số tiền lẻ (nếu có)."
                              },
                              {
                                  icon: <Zap className="h-5 w-5" />,
                                  title: "Duyệt tự động",
                                  desc: "Hệ thống cộng Xu sau 60 giây."
                              },
                              {
                                  icon: <Headphones className="h-5 w-5" />,
                                  title: "Hỗ trợ nạp",
                                  desc: "Zalo/Hotline hỗ trợ 24/7."
                              }
                          ].map((item, i) => (
                              <div key={i} className="flex gap-4 items-center">
                                  <div className="h-12 w-12 shrink-0 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#FF5722]">
                                      {item.icon}
                                  </div>
                                  <div>
                                      <h3 className="text-sm font-black text-slate-800 leading-none mb-1">{item.title}</h3>
                                      <p className="text-[11px] text-slate-500 font-bold opacity-60 uppercase tracking-tighter">{item.desc}</p>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
