import { useState, useEffect, useCallback, useRef } from "react";
import { pusherClient } from "@/lib/pusher";

interface PaymentStatusData {
  transaction_id: string;
  transaction_code: string;
  type: string;
  amount: number;
  status: "PENDING" | "SUCCESS" | "FAILED" | "EXPIRED";
  qr_code_url?: string;
  expire_at: string;
  paid_at?: string;
  created_at: string;
}

interface UsePaymentStatusOptions {
  interval?: number; // Polling interval in ms (default: 3000)
  enabled?: boolean; // Whether to start polling
  onSuccess?: (data: PaymentStatusData) => void;
  onExpired?: () => void;
  onError?: (error: Error) => void;
}

interface UsePaymentStatusReturn {
  data: PaymentStatusData | null;
  status: "PENDING" | "SUCCESS" | "FAILED" | "EXPIRED" | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  stopPolling: () => void;
  startPolling: () => void;
}

export function usePaymentStatus(
  transactionId: string | null,
  options: UsePaymentStatusOptions = {}
): UsePaymentStatusReturn {
  const {
    interval = 3000,
    enabled = true,
    onSuccess,
    onExpired,
    onError,
  } = options;

  const [data, setData] = useState<PaymentStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isPolling, setIsPolling] = useState(enabled);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onSuccessRef = useRef(onSuccess);
  const onExpiredRef = useRef(onExpired);
  const onErrorRef = useRef(onError);

  // Update refs when callbacks change
  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onExpiredRef.current = onExpired;
    onErrorRef.current = onError;
  }, [onSuccess, onExpired, onError]);

  const handleStatusUpdate = useCallback((statusData: PaymentStatusData) => {
    setData(statusData);

    // Handle status changes
    if (statusData.status === "SUCCESS") {
      setIsPolling(false);
      onSuccessRef.current?.(statusData);
    } else if (statusData.status === "EXPIRED") {
      setIsPolling(false);
      onExpiredRef.current?.();
    } else if (statusData.status === "FAILED") {
      setIsPolling(false);
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    if (!transactionId) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/v1/payment/status/${transactionId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch status");
      }

      const statusData = result.data as PaymentStatusData;
      handleStatusUpdate(statusData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      onErrorRef.current?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [transactionId, handleStatusUpdate]);

  // Real-time updates via Pusher
  useEffect(() => {
    if (!transactionId || !pusherClient) return;

    const channelName = `payment-${transactionId}`;
    console.log(`Subscribing to Pusher channel: ${channelName}`);
    
    const channel = pusherClient.subscribe(channelName);
    
    // Listen for payment_completed event
    channel.bind("payment_completed", async (payload: any) => {
      console.log("Payment status update received via Pusher:", payload);
      
      // If we got success payload, we might still want to fetch the full data 
      // from server to ensure local state is 100% correct with all fields
      if (payload.status === "SUCCESS") {
        await fetchStatus();
      }
    });

    return () => {
      console.log(`Unsubscribing from Pusher channel: ${channelName}`);
      pusherClient.unsubscribe(channelName);
    };
  }, [transactionId, fetchStatus]);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    setIsPolling(true);
  }, []);

  // Setup polling (fallback)
  useEffect(() => {
    if (!transactionId || !isPolling) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial fetch
    fetchStatus();

    // Start polling interval
    intervalRef.current = setInterval(fetchStatus, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [transactionId, isPolling, interval, fetchStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    data,
    status: data?.status || null,
    isLoading,
    error,
    refetch: fetchStatus,
    stopPolling,
    startPolling,
  };
}

export type { PaymentStatusData, UsePaymentStatusOptions };
