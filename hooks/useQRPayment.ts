"use client";

import { useState, useCallback } from "react";

interface CreateQRPaymentParams {
  type: "SUBSCRIPTION" | "ORDER" | "TOP_UP";
  reference_id?: string;
  amount: number;
}

interface QRPaymentData {
  transaction_id: string;
  transaction_code: string;
  qr_code_url: string;
  amount: number;
  expire_at: string;
}

interface UseQRPaymentReturn {
  createPayment: (params: CreateQRPaymentParams) => Promise<QRPaymentData | null>;
  isLoading: boolean;
  error: string | null;
  paymentData: QRPaymentData | null;
  clearPayment: () => void;
}

export function useQRPayment(): UseQRPaymentReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<QRPaymentData | null>(null);

  const createPayment = useCallback(
    async (params: CreateQRPaymentParams): Promise<QRPaymentData | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/v1/payment/create-qr", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(params),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to create QR payment");
        }

        const data = result.data as QRPaymentData;
        setPaymentData(data);
        return data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const clearPayment = useCallback(() => {
    setPaymentData(null);
    setError(null);
  }, []);

  return {
    createPayment,
    isLoading,
    error,
    paymentData,
    clearPayment,
  };
}

export type { CreateQRPaymentParams, QRPaymentData };
