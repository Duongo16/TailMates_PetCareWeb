import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Transaction, {
  TransactionType,
  TransactionStatus,
} from "@/models/Transaction";
import Package from "@/models/Package";
import Order from "@/models/Order";
import { authenticate, apiResponse } from "@/lib/auth";
import mongoose from "mongoose";
import {
  generateTransactionCode,
  generateQRCodeUrl,
  getTransactionExpiry,
  isValidAmount,
  checkSePayConfig,
} from "@/lib/sepay";

// POST /api/v1/payment/create-qr - Create QR code for payment
export async function POST(request: NextRequest) {
  try {
    // Check SePay configuration
    const configStatus = checkSePayConfig();
    if (!configStatus.isConfigured) {
      return apiResponse.error(
        `SePay not configured. Missing: ${configStatus.missing.join(", ")}`
      );
    }

    const { user, error } = await authenticate(request);
    if (error) return error;

    await connectDB();

    const body = await request.json();
    const { type, reference_id, amount } = body;

    // Validate type
    if (!type || !Object.values(TransactionType).includes(type)) {
      return apiResponse.error(
        "Valid type is required (SUBSCRIPTION, ORDER, TOP_UP)"
      );
    }

    // Validate amount
    if (!isValidAmount(amount)) {
      return apiResponse.error(
        "Invalid amount. Must be between 1,000 and 500,000,000 VND"
      );
    }

    // Validate reference_id for SUBSCRIPTION and ORDER types
    if (type === TransactionType.SUBSCRIPTION) {
      if (!reference_id || !mongoose.Types.ObjectId.isValid(reference_id)) {
        return apiResponse.error("Valid package reference_id is required");
      }
      const pkg = await Package.findById(reference_id);
      if (!pkg) {
        return apiResponse.notFound("Package not found");
      }
      if (pkg.price !== amount) {
        return apiResponse.error("Amount does not match package price");
      }
    }

    if (type === TransactionType.ORDER) {
      if (!reference_id || !mongoose.Types.ObjectId.isValid(reference_id)) {
        return apiResponse.error("Valid order reference_id is required");
      }
      const order = await Order.findById(reference_id);
      if (!order) {
        return apiResponse.notFound("Order not found");
      }
      if (order.total_amount !== amount) {
        return apiResponse.error("Amount does not match order total");
      }
    }

    // Generate unique transaction code
    let transactionCode = generateTransactionCode();
    let attempts = 0;
    const maxAttempts = 10;

    // Ensure unique transaction code
    while (attempts < maxAttempts) {
      const existing = await Transaction.findOne({
        transaction_code: transactionCode,
      });
      if (!existing) break;
      transactionCode = generateTransactionCode();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return apiResponse.serverError(
        "Failed to generate unique transaction code"
      );
    }

    // Generate QR code URL
    const qrCodeUrl = generateQRCodeUrl({
      amount,
      transactionCode,
      description: `TailMates ${transactionCode}`,
    });

    // Calculate expiry time (15 minutes)
    const expireAt = getTransactionExpiry(15);

    // Create transaction record
    const transaction = await Transaction.create({
      user_id: user!._id,
      type,
      reference_id: reference_id
        ? new mongoose.Types.ObjectId(reference_id)
        : undefined,
      amount,
      transaction_code: transactionCode,
      qr_code_url: qrCodeUrl,
      status: TransactionStatus.PENDING,
      expire_at: expireAt,
    });

    return apiResponse.success(
      {
        transaction_id: transaction._id,
        transaction_code: transactionCode,
        qr_code_url: qrCodeUrl,
        amount,
        expire_at: expireAt,
      },
      "QR code created successfully"
    );
  } catch (error) {
    console.error("Create QR error:", error);
    return apiResponse.serverError("Failed to create QR code");
  }
}
