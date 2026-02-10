"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { usePaymentStatus } from "@/hooks/usePaymentStatus";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Coins, QrCode, CheckCircle2, AlertCircle, ArrowRight, Copy, Check, MessageSquareText, Target, Zap, Headphones } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { paymentAPI } from "@/lib/api";
import { SiteHeader } from "@/components/site-header";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const ORANGE_FINTECH = "#FF5722";

const TOP_UP_OPTIONS = [
  { amount: 10000, label: "10,000" },
  { amount: 20000, label: "20,000" },
  { amount: 50000, label: "50,000" },
  { amount: 100000, label: "100,000" },
  { amount: 200000, label: "200,000" },
  { amount: 500000, label: "500,000" },
];

export default function TopUpPage() {
  const { user, refreshUser } = useAuth();
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

  if (!user || !["customer", "merchant"].includes(user.role)) {
    return (
      <div className="h-screen bg-white flex flex-col font-sans">
        <SiteHeader />
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

  return (
    <div className="h-screen bg-[#F8F9FA] flex flex-col overflow-hidden font-sans selection:bg-[#FF5722]/10">
      <SiteHeader />
      
      <main className="flex-1 flex items-center justify-center p-4 md:p-8 lg:p-12 overflow-hidden">
        <div className="max-w-6xl w-full h-full lg:max-h-[750px] grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* LEFT SIDE: Amount Selection */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-8"
          >
            <div className="space-y-2">
                <h1 className="text-4xl font-black text-[#212121] tracking-tight">Nạp Xu TailMates</h1>
                <p className="text-slate-500 font-medium">Chọn số tiền để nạp vào tài khoản của bạn ngay lập tức.</p>
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  {TOP_UP_OPTIONS.map((opt) => (
                    <button
                      key={opt.amount}
                      onClick={() => {
                        setSelectedAmount(opt.amount);
                        setCustomAmount("");
                      }}
                      className={cn(
                        "p-6 rounded-3xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-2 group relative overflow-hidden",
                        selectedAmount === opt.amount 
                          ? "border-[#FF5722] bg-[#FF5722]/5 shadow-xl shadow-[#FF5722]/10" 
                          : "border-white bg-white hover:border-slate-200 text-slate-600 shadow-sm"
                      )}
                    >
                      <div className="flex items-baseline gap-1">
                        <span className={cn(
                          "text-2xl font-black group-hover:scale-110 transition-transform",
                          selectedAmount === opt.amount ? "text-[#FF5722]" : "text-slate-800"
                        )}>{opt.label}</span>
                        <span className={cn(
                          "text-xs font-bold uppercase",
                          selectedAmount === opt.amount ? "text-[#FF5722]/60" : "text-slate-400"
                        )}>đ</span>
                      </div>
                      {selectedAmount === opt.amount && (
                        <motion.div layoutId="active-bg" className="absolute bottom-0 left-0 right-0 h-1 bg-[#FF5722]" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                    <Label htmlFor="custom-amount" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Số tiền khác</Label>
                    <div className="relative">
                        <Input
                            id="custom-amount"
                            type="number"
                            placeholder="Nhập số tiền muốn nạp (VNĐ)"
                            value={customAmount}
                            onChange={(e) => {
                                setCustomAmount(e.target.value);
                                setSelectedAmount(null);
                            }}
                            className="h-16 rounded-3xl border-none bg-white shadow-md px-8 text-xl font-black placeholder:text-slate-300 focus-visible:ring-2 focus-visible:ring-[#FF5722]/20 transition-all"
                        />
                        <div className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-300 font-bold">VNĐ</div>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <Button 
                    className="w-full h-18 text-xl font-black rounded-3xl bg-gradient-to-r from-[#FF5722] to-[#FF7043] shadow-lg shadow-[#FF5722]/20 transition-all duration-300 hover:shadow-2xl hover:shadow-[#FF5722]/40 active:scale-[0.98] py-8" 
                    onClick={handleCreateQR} 
                    disabled={isCreating || (!selectedAmount && !customAmount)}
                >
                    {isCreating ? (
                        <><Loader2 className="mr-3 h-7 w-7 animate-spin" />Đang xử lý...</>
                    ) : (
                        transaction ? "Tạo mã mới" : "Xác nhận nạp tiền"
                    )}
                </Button>

                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="h-[2px] w-10 bg-[#FF5722] rounded-full"></div>
                        <h2 className="text-sm font-black uppercase tracking-[0.15em] text-slate-500">Hướng dẫn chuyển khoản</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            {
                                icon: <MessageSquareText className="h-5 w-5" />,
                                title: "Giữ nguyên nội dung",
                                desc: "Dán chính xác mã giao dịch vào phần lời nhắn."
                            },
                            {
                                icon: <Target className="h-5 w-5" />,
                                title: "Chính xác số tiền",
                                desc: "Chuyển đúng số tiền được hiển thị để duyệt tự động."
                            },
                            {
                                icon: <Zap className="h-5 w-5" />,
                                title: "Xử lý tức thì",
                                desc: "Xu sẽ được cộng vào ví của bạn sau 1-3 phút."
                            },
                            {
                                icon: <Headphones className="h-5 w-5" />,
                                title: "Hỗ trợ 24/7",
                                desc: "Liên hệ CSKH nếu quá 10 phút chưa nhận được Xu."
                            }
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4 p-4 rounded-3xl bg-white border border-slate-100 shadow-sm hover:border-[#FF5722]/30 transition-all group">
                                <div className="h-10 w-10 shrink-0 rounded-2xl bg-[#FF5722]/10 flex items-center justify-center text-[#FF5722] group-hover:scale-110 transition-transform">
                                    {item.icon}
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-sm font-bold text-slate-800">{item.title}</h3>
                                    <p className="text-[11px] text-slate-500 leading-normal font-medium">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          </motion.div>

          {/* RIGHT SIDE: Floating QR Card */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-center lg:justify-end"
          >
            <Card className="max-w-[420px] w-full bg-white rounded-[48px] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.15)] border-none overflow-hidden p-8 md:p-12">
                <div className="flex flex-col items-center gap-8">
                    {!transaction ? (
                      <div className="flex flex-col items-center text-center py-20 gap-6 opacity-20">
                        <div className="bg-slate-50 w-32 h-32 rounded-3xl flex items-center justify-center border-2 border-dashed border-slate-200">
                          <QrCode className="h-16 w-16 stroke-[1]" />
                        </div>
                        <p className="text-sm font-bold uppercase tracking-widest">Đang đợi lệnh nạp</p>
                      </div>
                    ) : status === "SUCCESS" ? (
                      <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }} 
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col items-center text-center py-10 gap-6"
                      >
                        <div className="bg-[#4CAF50]/10 w-24 h-24 rounded-full flex items-center justify-center text-[#4CAF50] border-2 border-[#4CAF50]/20">
                          <CheckCircle2 className="h-12 w-12" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-2xl font-black text-slate-900">Thành công!</h3>
                          <p className="text-slate-500 font-medium">Tài khoản của bạn đã được cộng <span className="text-[#FF5722] font-bold">{transaction.amount.toLocaleString()}đ</span></p>
                          <p className="text-xs text-slate-400 mt-2 italic">Đang chuyển hướng về Dashboard sau {countdown}s...</p>
                        </div>
                        <Button variant="ghost" className="text-slate-400 font-bold hover:text-[#FF5722] mt-4" onClick={() => setTransaction(null)}>Thực hiện giao dịch khác</Button>
                      </motion.div>
                    ) : (
                      <div className="w-full flex flex-col items-center gap-6">
                        {/* Status Header */}
                        <div className="flex items-center gap-3">
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF9800] opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FF9800]"></span>
                            </span>
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-[#FF9800]">Đang đợi thanh toán</span>
                        </div>

                        {/* Recipient Info Section */}
                        <div className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col gap-2">
                            <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest text-slate-400">
                                <span>Người thụ hưởng</span>
                                <Badge variant="outline" className="bg-white text-[#FF5722] border-[#FF5722]/20 text-[8px] h-5 px-2">{transaction.bank_name}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <div className="text-[12px] font-bold text-slate-800 leading-none">{transaction.account_name}</div>
                                    <div className="text-[15px] font-mono font-black text-[#FF5722] tracking-tight leading-none">
                                        {transaction.account_number}
                                    </div>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-slate-400 hover:text-[#FF5722] hover:bg-[#FF5722]/5"
                                    onClick={() => copyToClipboard(transaction.account_number)}
                                >
                                    <Copy className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>

                        {/* QR Code Container */}
                        <div className="relative bg-white rounded-[40px] p-6 shadow-2xl border border-slate-50 group transition-transform hover:scale-[1.02] duration-500">
                            <div className="w-[220px] md:w-[260px] aspect-square relative">
                                <Image 
                                    src={transaction.qr_code_url} 
                                    alt="Payment QR Code" 
                                    fill
                                    className="object-contain"
                                    priority
                                />
                            </div>
                        </div>

                        {/* Transaction Details */}
                        <div className="w-full space-y-4">
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Số tiền cần chuyển</span>
                                <div className="text-4xl font-black text-slate-900 flex items-baseline gap-1">
                                    {transaction.amount.toLocaleString()}
                                    <span className="text-sm font-bold opacity-30 uppercase tracking-tighter">vnd</span>
                                </div>
                            </div>
                            
                            <div className="bg-slate-50 rounded-2xl p-4 flex justify-between items-center group/id border border-slate-100">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Nội dung chuyển khoản</span>
                                    <span className="font-mono font-bold text-slate-700 tracking-wider">
                                        {transaction.transaction_code}
                                    </span>
                                </div>
                                <Button 
                                    variant="secondary" 
                                    size="icon" 
                                    className="h-10 w-10 rounded-xl bg-white border border-slate-100 hover:border-[#FF5722] hover:text-[#FF5722] transition-colors"
                                    onClick={() => copyToClipboard(transaction.transaction_code)}
                                >
                                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                        {/* Security Footer */}
                        <div className="flex items-center gap-2 opacity-30 grayscale hover:grayscale-0 transition-all pt-2">
                            <div className="h-[2px] w-8 bg-slate-300"></div>
                            <span className="text-[10px] font-bold uppercase tracking-widest">Bảo mật bởi SePay</span>
                            <div className="h-[2px] w-8 bg-slate-300"></div>
                        </div>
                      </div>
                    )}
                </div>
            </Card>
          </motion.div>

        </div>
      </main>
    </div>
  );
}
