import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Package from "@/models/Package";
import SubscriptionLog from "@/models/SubscriptionLog";
import Transaction, {
  TransactionType,
  TransactionStatus,
} from "@/models/Transaction";
import { authenticate, authorize, apiResponse } from "@/lib/auth";
import { UserRole } from "@/models/User";
import mongoose from "mongoose";

// POST /api/v1/payment/subscribe-customer - Subscribe to customer package
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    const authError = authorize(user!, [UserRole.CUSTOMER]);
    if (authError) return authError;

    await connectDB();

    const body = await request.json();
    const { package_id, payment_gateway_id } = body;

    if (!package_id || !mongoose.Types.ObjectId.isValid(package_id)) {
      return apiResponse.error("Valid package_id is required");
    }

    // Get package
    const pkg = await Package.findById(package_id);
    if (!pkg) {
      return apiResponse.notFound("Package not found");
    }

    if (pkg.target_role !== "CUSTOMER") {
      return apiResponse.error("This package is not for customers");
    }

    // Refresh user data to get latest balance
    const freshUser = await User.findById(user!._id);
    if (!freshUser) return apiResponse.notFound("User not found");

    // Check TM balance
    if ((freshUser.tm_balance || 0) < pkg.price) {
      return apiResponse.error(
        `Số dư TM không đủ. Cần ${pkg.price.toLocaleString()} TM, hiện có ${
          freshUser.tm_balance?.toLocaleString() || 0
        } TM.`
      );
    }

    // Deduct balance
    freshUser.tm_balance = (freshUser.tm_balance || 0) - pkg.price;
    await freshUser.save();

    // Calculate subscription dates
    // If user has active subscription, extend from current expiry date
    let startDate = new Date();
    const existingSub = freshUser.subscription;
    if (
      existingSub?.expired_at &&
      new Date(existingSub.expired_at) > new Date()
    ) {
      startDate = new Date(existingSub.expired_at);
    }
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + pkg.duration_months);

    // Build features array from config
    const features: string[] = [];
    if (pkg.features_config.priority_support) features.push("PRIORITY_SUPPORT");
    if (pkg.features_config.ai_limit_per_day >= 100)
      features.push("UNLIMITED_AI");
    if (pkg.features_config.max_pets >= 10) features.push("UNLIMITED_PETS");

    // Update user subscription
    await User.findByIdAndUpdate(user!._id, {
      $set: {
        subscription: {
          package_id: pkg._id,
          started_at: startDate,
          expired_at: endDate,
          features,
        },
      },
    });

    // Create transaction record for TM payment
    const transaction = await Transaction.create({
      user_id: user!._id,
      type: TransactionType.SUBSCRIPTION,
      reference_id: pkg._id,
      amount: pkg.price,
      transaction_code: `TM_SUB_C_${Date.now()}`,
      status: TransactionStatus.SUCCESS,
      paid_at: new Date(),
      expire_at: new Date(), // Already paid
    });

    // Log subscription payment
    const subscriptionLog = await SubscriptionLog.create({
      user_id: user!._id,
      package_id: pkg._id,
      amount: pkg.price,
      payment_gateway_id: `TM_VALLET_${transaction._id}`,
      status: "SUCCESS",
    });

    return apiResponse.success(
      {
        subscription: {
          package_name: pkg.name,
          started_at: startDate,
          expired_at: endDate,
          features,
        },
        payment_log_id: subscriptionLog._id,
      },
      "Subscription successful"
    );
  } catch (error) {
    console.error("Subscribe customer error:", error);
    return apiResponse.serverError("Subscription failed");
  }
}
