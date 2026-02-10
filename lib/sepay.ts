import { createHmac, timingSafeEqual } from "node:crypto";

// ==================== Types ====================
interface SePayConfig {
  apiToken: string;
  bankAccountId: string;
  accountNumber: string;
  bankId: string;
  webhookSecret: string;
}

interface QRCodeOptions {
  amount: number;
  transactionCode: string;
  description?: string;
  accountName?: string;
}

interface WebhookPayload {
  id: number;
  gateway: string;
  transactionDate: string;
  accountNumber: string;
  subAccount?: string;
  code?: string;
  content: string;
  transferType: "in" | "out";
  description?: string;
  transferAmount: number;
  referenceCode: string;
  accumulated: number;
}

// ==================== Config ====================
const getSePayConfig = (): SePayConfig => {
  const config = {
    apiToken: process.env.SEPAY_API_TOKEN || "",
    bankAccountId: process.env.SEPAY_BANK_ACCOUNT_ID || "",
    accountNumber: process.env.SEPAY_ACCOUNT_NUMBER || "",
    bankId: process.env.SEPAY_BANK_ID || "MB",
    webhookSecret: process.env.SEPAY_WEBHOOK_SECRET || "",
  };

  return config;
};

// ==================== Transaction Code Generator ====================
/**
 * Generate a unique transaction code for bank transfer
 * Format: TM + 6 random alphanumeric characters (uppercase)
 * Example: TM4A7B2C
 */
export const generateTransactionCode = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "TM";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// ==================== QR Code Generation ====================
/**
 * Generate VietQR code URL using img.vietqr.io service
 * @param options - QR code options
 * @returns VietQR image URL
 */
export const generateQRCodeUrl = (options: QRCodeOptions): string => {
  const config = getSePayConfig();
  const { amount, transactionCode, description } = options;

  // Build transfer content (nội dung chuyển khoản)
  // MUST start with TKPTM2
  const prefix = "TKPTM2";
  const transferContent = description || `${prefix} ${transactionCode}`;

  // Ensure description starts with prefix if user provides a custom one
  const finalContent = transferContent.startsWith(prefix) 
    ? transferContent 
    : `${prefix} ${transferContent}`;

  // SePay QR URL format
  // https://qr.sepay.vn/img?acc={ACCOUNT_NUMBER}&bank={BANK_ID}&amount={AMOUNT}&des={CONTENT}
  const baseUrl = "https://qr.sepay.vn/img";

  const params = new URLSearchParams();
  params.append("acc", config.accountNumber);
  params.append("bank", config.bankId);
  params.append("amount", amount.toString());
  params.append("des", finalContent);

  return `${baseUrl}?${params.toString()}`;
};

// ==================== Webhook Verification ====================
/**
 * Verify SePay webhook signature
 * @param payload - Raw request body
 * @param signature - Signature from request header
 * @returns boolean indicating if signature is valid
 */
export const verifyWebhookSignature = (
  payload: string,
  signature: string
): boolean => {
  const config = getSePayConfig();

  if (!config.webhookSecret) {
    console.warn("SEPAY_WEBHOOK_SECRET not configured, skipping verification");
    return true;
  }

  if (!signature) {
    console.error("Webhook signature missing in headers");
    return false;
  }

  // SePay might send Authorization: "Apikey YOUR_KEY"
  // We need to extract the actual key
  const actualToken = signature.startsWith("Apikey ") 
    ? signature.substring(7) 
    : signature;

  // Method 1: Literal comparison (Standard for many simple webhooks)
  if (actualToken === config.webhookSecret) {
    return true;
  }

  // Method 2: HMAC SHA256 comparison
  const expectedSignature = createHmac("sha256", config.webhookSecret)
    .update(payload)
    .digest("hex");

  const signatureBuffer = Buffer.from(actualToken);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length === expectedBuffer.length &&
    timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return true;
  }

  console.error("Webhook signature mismatch.");
  console.log("Received signature (first 5 chars):", signature.substring(0, 5) + "...");
  // DO NOT log the whole expected signature or secret for security
  
  return false;
};

// ==================== Transaction Content Parser ====================
/**
 * Parse transaction content to extract transaction code
 * Looks for pattern like "TM" followed by 6 alphanumeric characters
 * @param content - Bank transfer content/description
 * @returns Transaction code or null if not found
 */
export const parseTransactionCode = (content: string): string | null => {
  if (!content) return null;

  // Match pattern: TM + 6 alphanumeric characters or TKPTM2 + 6 alphanumeric characters
  // SePay might send the full description, we need to find our transaction code
  const match = content.toUpperCase().match(/TM[A-Z0-9]{6}/);
  return match ? match[0] : null;
};

// ==================== Webhook Data Parser ====================
/**
 * Parse and validate SePay webhook payload
 * @param data - Webhook payload
 * @returns Parsed webhook payload or null if invalid
 */
export const parseWebhookPayload = (
  data: Record<string, unknown>
): WebhookPayload | null => {
  try {
    // Validate required fields (handle potential string-to-number conversion)
    const id = typeof data.id === "number" ? data.id : Number(data.id);
    const transferAmount = typeof data.transferAmount === "number" ? data.transferAmount : Number(data.transferAmount);
    const accumulated = typeof data.accumulated === "number" ? data.accumulated : Number(data.accumulated);

    if (
      isNaN(id) ||
      typeof data.content !== "string" ||
      isNaN(transferAmount)
    ) {
      console.error("Invalid SePay data:", data);
      return null;
    }

    return {
      id,
      gateway: (data.gateway as string) || "",
      transactionDate: (data.transactionDate as string) || "",
      accountNumber: (data.accountNumber as string) || "",
      subAccount: data.subAccount as string | undefined,
      code: data.code as string | undefined,
      content: data.content as string,
      transferType: (data.transferType as "in" | "out") || "in",
      description: data.description as string | undefined,
      transferAmount,
      referenceCode: (data.referenceCode as string) || "",
      accumulated,
    };
  } catch (err) {
    console.error("Error parsing SePay payload:", err);
    return null;
  }
};

// ==================== Transaction Expiry ====================
/**
 * Get expiry date for a transaction (default 15 minutes)
 * @param minutes - Number of minutes until expiry
 * @returns Expiry date
 */
export const getTransactionExpiry = (minutes: number = 15): Date => {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + minutes);
  return expiry;
};

// ==================== Amount Validation ====================
/**
 * Validate payment amount
 * @param amount - Amount in VND
 * @returns boolean indicating if amount is valid
 */
export const isValidAmount = (amount: number): boolean => {
  return (
    typeof amount === "number" &&
    amount >= 1000 && // Minimum 1,000 VND
    amount <= 500000000 && // Maximum 500 million VND
    Number.isInteger(amount)
  );
};

// ==================== Export Config Checker ====================
/**
 * Check if SePay is properly configured
 * @returns Object with configuration status
 */
export const checkSePayConfig = (): {
  isConfigured: boolean;
  missing: string[];
} => {
  const config = getSePayConfig();
  const missing: string[] = [];

  if (!config.accountNumber) missing.push("SEPAY_ACCOUNT_NUMBER");
  if (!config.bankId) missing.push("SEPAY_BANK_ID");

  return {
    isConfigured: missing.length === 0,
    missing,
  };
};

export type { SePayConfig, QRCodeOptions, WebhookPayload };
