import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Transaction, { TransactionStatus } from "@/models/Transaction";
import { authenticate, apiResponse } from "@/lib/auth";
import mongoose from "mongoose";

// GET /api/v1/payment/status/[id] - Get transaction status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    await connectDB();

    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return apiResponse.error("Valid transaction ID is required");
    }

    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return apiResponse.notFound("Transaction not found");
    }

    // Check if user owns this transaction
    if (transaction.user_id.toString() !== user!._id.toString()) {
      return apiResponse.forbidden("Access denied");
    }

    // Check if transaction has expired (only for PENDING transactions)
    if (
      transaction.status === TransactionStatus.PENDING &&
      new Date() > transaction.expire_at
    ) {
      // Update status to EXPIRED
      transaction.status = TransactionStatus.EXPIRED;
      await transaction.save();
    }

    return apiResponse.success({
      transaction_id: transaction._id,
      transaction_code: transaction.transaction_code,
      type: transaction.type,
      amount: transaction.amount,
      status: transaction.status,
      qr_code_url: transaction.qr_code_url,
      expire_at: transaction.expire_at,
      paid_at: transaction.paid_at,
      created_at: transaction.created_at,
    });
  } catch (error) {
    console.error("Get transaction status error:", error);
    return apiResponse.serverError("Failed to get transaction status");
  }
}
