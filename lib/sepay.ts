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
  const { amount, transactionCode, description, accountName } = options;

  // Build transfer content (nội dung chuyển khoản)
  const transferContent = description || `TailMates ${transactionCode}`;

  // VietQR URL format
  // https://img.vietqr.io/image/{BANK_ID}-{ACCOUNT_NUMBER}-{TEMPLATE}.png?amount={AMOUNT}&addInfo={CONTENT}&accountName={NAME}
  const baseUrl = "https://img.vietqr.io/image";
  const template = "compact2"; // compact, compact2, qr_only, print

  const params = new URLSearchParams();
  params.append("amount", amount.toString());
  params.append("addInfo", transferContent);
  if (accountName) {
    params.append("accountName", accountName);
  }

  return `${baseUrl}/${config.bankId}-${config.accountNumber}-${template}.png?${params.toString()}`;
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
    return true; // Allow in development without secret
  }

  const expectedSignature = createHmac("sha256", config.webhookSecret)
    .update(payload)
    .digest("hex");

  return timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
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

  // Match pattern: TM + 6 alphanumeric characters
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
    // Validate required fields
    if (
      typeof data.id !== "number" ||
      typeof data.content !== "string" ||
      typeof data.transferAmount !== "number"
    ) {
      return null;
    }

    return {
      id: data.id as number,
      gateway: (data.gateway as string) || "",
      transactionDate: (data.transactionDate as string) || "",
      accountNumber: (data.accountNumber as string) || "",
      subAccount: data.subAccount as string | undefined,
      code: data.code as string | undefined,
      content: data.content as string,
      transferType: (data.transferType as "in" | "out") || "in",
      description: data.description as string | undefined,
      transferAmount: data.transferAmount as number,
      referenceCode: (data.referenceCode as string) || "",
      accumulated: (data.accumulated as number) || 0,
    };
  } catch {
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
