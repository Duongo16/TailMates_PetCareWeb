"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePaymentStatus } from "@/hooks/usePaymentStatus";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  Check,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QRPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: string | null;
  transactionCode: string;
  qrCodeUrl: string;
  amount: number;
  expireAt: string;
  onSuccess?: () => void;
  onExpired?: () => void;
}

type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "EXPIRED";

export function QRPaymentModal({
  isOpen,
  onClose,
  transactionId,
  transactionCode,
  qrCodeUrl,
  amount,
  expireAt,
  onSuccess,
  onExpired,
}: QRPaymentModalProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<PaymentStatus>("PENDING");

  // Calculate initial time left
  useEffect(() => {
    if (!expireAt) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expireAt).getTime();
      const diff = Math.max(0, Math.floor((expiry - now) / 1000));
      return diff;
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        setCurrentStatus("EXPIRED");
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expireAt]);

  // Use payment status hook
  const { status, isLoading } = usePaymentStatus(
    isOpen && currentStatus === "PENDING" ? transactionId : null,
    {
      interval: 3000,
      enabled: isOpen && currentStatus === "PENDING",
      onSuccess: () => {
        setCurrentStatus("SUCCESS");
        onSuccess?.();
      },
      onExpired: () => {
        setCurrentStatus("EXPIRED");
        onExpired?.();
      },
    }
  );

  // Update status from hook
  useEffect(() => {
    if (status && status !== currentStatus) {
      setCurrentStatus(status);
    }
  }, [status, currentStatus]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Format amount with VND
  const formatAmount = (value: number): string => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  // Copy transaction code to clipboard
  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(transactionCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [transactionCode]);

  // Handle close
  const handleClose = () => {
    if (currentStatus === "PENDING") {
      // Confirm before closing while payment is pending
      if (
        window.confirm(
          "Bạn có chắc muốn đóng? Giao dịch sẽ vẫn được xử lý nếu bạn đã chuyển khoản."
        )
      ) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  // Render status icon
  const renderStatusIcon = () => {
    switch (currentStatus) {
      case "SUCCESS":
        return (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-bounce">
              <CheckCircle2 className="h-24 w-24 text-green-500" />
            </div>
            <h3 className="mt-4 text-2xl font-bold text-green-600">
              Thanh toán thành công!
            </h3>
            <p className="mt-2 text-muted-foreground">
              Gói dịch vụ của bạn đã được kích hoạt
            </p>
          </div>
        );
      case "EXPIRED":
        return (
          <div className="flex flex-col items-center justify-center py-8">
            <XCircle className="h-24 w-24 text-red-500" />
            <h3 className="mt-4 text-2xl font-bold text-red-600">
              Đã hết thời gian
            </h3>
            <p className="mt-2 text-muted-foreground">
              Mã QR đã hết hạn. Vui lòng tạo mã mới.
            </p>
          </div>
        );
      case "FAILED":
        return (
          <div className="flex flex-col items-center justify-center py-8">
            <XCircle className="h-24 w-24 text-red-500" />
            <h3 className="mt-4 text-2xl font-bold text-red-600">
              Thanh toán thất bại
            </h3>
            <p className="mt-2 text-muted-foreground">
              Đã có lỗi xảy ra. Vui lòng thử lại.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {currentStatus === "PENDING"
              ? "Thanh toán qua QR Code"
              : currentStatus === "SUCCESS"
                ? "Hoàn tất thanh toán"
                : "Thanh toán không thành công"}
          </DialogTitle>
          {currentStatus === "PENDING" && (
            <DialogDescription className="text-center">
              Quét mã QR bằng ứng dụng ngân hàng để thanh toán
            </DialogDescription>
          )}
        </DialogHeader>

        {currentStatus === "PENDING" ? (
          <div className="flex flex-col items-center gap-4">
            {/* Timer */}
            <div
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2",
                timeLeft <= 60
                  ? "bg-red-100 text-red-700"
                  : "bg-orange-100 text-orange-700"
              )}
            >
              <Clock className="h-4 w-4" />
              <span className="font-mono font-semibold">
                {formatTime(timeLeft)}
              </span>
            </div>

            {/* QR Code */}
            <div className="relative overflow-hidden rounded-xl border-4 border-primary/20 bg-white p-2 shadow-lg">
              <Image
                src={qrCodeUrl}
                alt="QR Code thanh toán"
                width={280}
                height={280}
                className="rounded-lg"
                priority
              />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
            </div>

            {/* Amount */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Số tiền thanh toán</p>
              <p className="text-3xl font-bold text-primary">
                {formatAmount(amount)}
              </p>
            </div>

            {/* Transaction Code */}
            <div className="w-full rounded-lg bg-muted/50 p-4">
              <p className="mb-2 text-center text-sm text-muted-foreground">
                Nội dung chuyển khoản
              </p>
              <div className="flex items-center justify-center gap-2">
                <code className="rounded bg-background px-3 py-2 text-lg font-bold tracking-wider">
                  {transactionCode}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copyToClipboard}
                  className="h-10 w-10"
                >
                  {copied ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </Button>
              </div>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                ⚠️ Vui lòng nhập đúng nội dung chuyển khoản
              </p>
            </div>

            {/* Instructions */}
            <div className="w-full rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h4 className="mb-2 font-semibold text-blue-800">Hướng dẫn:</h4>
              <ol className="list-inside list-decimal space-y-1 text-sm text-blue-700">
                <li>Mở ứng dụng ngân hàng trên điện thoại</li>
                <li>Chọn quét mã QR và quét mã trên</li>
                <li>Kiểm tra thông tin và xác nhận thanh toán</li>
                <li>Chờ hệ thống xác nhận giao dịch</li>
              </ol>
            </div>

            {/* Polling indicator */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Đang chờ thanh toán...</span>
            </div>
          </div>
        ) : (
          <>
            {renderStatusIcon()}
            <div className="flex justify-center pt-4">
              <Button onClick={onClose} size="lg">
                {currentStatus === "SUCCESS" ? "Hoàn tất" : "Đóng"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default QRPaymentModal;
