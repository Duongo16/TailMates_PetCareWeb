import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Transaction, {
  TransactionStatus,
  TransactionType,
} from "@/models/Transaction";
import User from "@/models/User";
import Package from "@/models/Package";
import Order, { OrderStatus } from "@/models/Order";
import SubscriptionLog from "@/models/SubscriptionLog";
import {
  verifyWebhookSignature,
  parseTransactionCode,
  parseWebhookPayload,
} from "@/lib/sepay";
import { pusherServer } from "@/lib/pusher";

// POST /api/v1/payment/webhook - SePay webhook callback
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-sepay-signature") || "";

    // Verify webhook signature (optional in development)
    if (
      process.env.NODE_ENV === "production" &&
      !verifyWebhookSignature(rawBody, signature)
    ) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Parse webhook payload
    const data = JSON.parse(rawBody);
    const webhookPayload = parseWebhookPayload(data);

    if (!webhookPayload) {
      console.error("Invalid webhook payload:", data);
      return NextResponse.json(
        { error: "Invalid payload format" },
        { status: 400 }
      );
    }

    // Only process incoming transfers
    if (webhookPayload.transferType !== "in") {
      return NextResponse.json({
        success: true,
        message: "Ignored: not an incoming transfer",
      });
    }

    await connectDB();

    // Extract transaction code from content
    const transactionCode = parseTransactionCode(webhookPayload.content);

    if (!transactionCode) {
      console.log(
        "No TailMates transaction code found in content:",
        webhookPayload.content
      );
      return NextResponse.json({
        success: true,
        message: "No matching transaction code",
      });
    }

    // Find pending transaction with this code
    const transaction = await Transaction.findOne({
      transaction_code: transactionCode,
      status: TransactionStatus.PENDING,
    });

    if (!transaction) {
      console.log("No pending transaction found for code:", transactionCode);
      return NextResponse.json({
        success: true,
        message: "No pending transaction found",
      });
    }

    // Check if transaction has expired
    if (new Date() > transaction.expire_at) {
      transaction.status = TransactionStatus.EXPIRED;
      await transaction.save();
      return NextResponse.json({
        success: true,
        message: "Transaction expired",
      });
    }

    // Verify amount matches
    if (webhookPayload.transferAmount !== transaction.amount) {
      console.log(
        `Amount mismatch: expected ${transaction.amount}, got ${webhookPayload.transferAmount}`
      );
      return NextResponse.json({
        success: true,
        message: "Amount mismatch",
      });
    }

    // Update transaction to SUCCESS
    transaction.status = TransactionStatus.SUCCESS;
    transaction.sepay_transaction_id = String(webhookPayload.id);
    transaction.paid_at = new Date();
    await transaction.save();

    // Trigger real-time notification via Pusher
    if (pusherServer) {
      await pusherServer.trigger(
        `payment-${transaction._id}`,
        "payment_completed",
        {
          status: TransactionStatus.SUCCESS,
          transaction_id: transaction._id,
          transaction_code: transactionCode,
          amount: transaction.amount,
        }
      );
      console.log(`Pusher notification sent for transaction ${transactionCode}`);
    }

    // Process based on transaction type
    if (transaction.type === TransactionType.SUBSCRIPTION) {
      await processSubscription(transaction);
    } else if (transaction.type === TransactionType.ORDER) {
      await processOrder(transaction);
    } else if (transaction.type === TransactionType.TOP_UP) {
      await processTopUp(transaction);
    }

    console.log(
      `Transaction ${transactionCode} completed successfully for amount ${transaction.amount}`
    );

    return NextResponse.json({
      success: true,
      message: "Transaction processed successfully",
      transaction_id: transaction._id,
    });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to process subscription after successful payment
async function processSubscription(
  transaction: InstanceType<typeof Transaction>
) {
  try {
    if (!transaction.reference_id) {
      console.error("No reference_id for subscription transaction");
      return;
    }

    // Get package info
    const pkg = await Package.findById(transaction.reference_id);
    if (!pkg) {
      console.error("Package not found:", transaction.reference_id);
      return;
    }

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + pkg.duration_months);

    // Build features array from config
    const features: string[] = [];
    if (pkg.features_config.priority_support) features.push("PRIORITY_SUPPORT");
    if (pkg.features_config.ai_limit_per_day >= 100)
      features.push("UNLIMITED_AI");
    if (pkg.features_config.max_pets >= 10) features.push("UNLIMITED_PETS");

    // Update user subscription
    await User.findByIdAndUpdate(transaction.user_id, {
      $set: {
        subscription: {
          package_id: pkg._id,
          started_at: startDate,
          expired_at: endDate,
          features,
        },
      },
    });

    // Log subscription payment
    await SubscriptionLog.create({
      user_id: transaction.user_id,
      package_id: pkg._id,
      amount: transaction.amount,
      payment_gateway_id: transaction.sepay_transaction_id,
      status: "SUCCESS",
    });

    console.log(
      `Subscription activated for user ${transaction.user_id} with package ${pkg.name}`
    );
  } catch (error) {
    console.error("Failed to process subscription:", error);
  }
}

// Helper function to process order after successful payment
async function processOrder(transaction: InstanceType<typeof Transaction>) {
  try {
    if (!transaction.reference_id) {
      console.error("No reference_id for order transaction");
      return;
    }

    const order = await Order.findByIdAndUpdate(transaction.reference_id, {
      $set: { status: OrderStatus.CONFIRMED },
    });

    if (order) {
      console.log(`Order ${order._id} confirmed via payment`);
    } else {
      console.error("Order not found:", transaction.reference_id);
    }
  } catch (error) {
    console.error("Failed to process order:", error);
  }
}

// Helper function to process top up
async function processTopUp(transaction: InstanceType<typeof Transaction>) {
  try {
    const user = await User.findByIdAndUpdate(transaction.user_id, {
      $inc: { tm_balance: transaction.amount },
    });

    if (user) {
      console.log(
        `Top-up of ${transaction.amount} TM completed for user ${user.full_name} (${user._id}). New balance: ${(user.tm_balance || 0) + transaction.amount}`
      );
    } else {
      console.error("User not found for top-up:", transaction.user_id);
    }
  } catch (error) {
    console.error("Failed to process top-up:", error);
  }
}
