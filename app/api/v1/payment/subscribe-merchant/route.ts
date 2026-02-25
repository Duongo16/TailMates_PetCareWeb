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
import { createNotification, NotificationType } from "@/lib/notification-service";

// POST /api/v1/payment/subscribe-merchant - Subscribe to merchant package
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    const authError = authorize(user!, [UserRole.MERCHANT]);
    if (authError) return authError;

    await connectDB();

    const body = await request.json();
    const { package_id } = body;

    if (!package_id || !mongoose.Types.ObjectId.isValid(package_id)) {
      return apiResponse.error("Valid package_id is required");
    }

    // Get package
    const pkg = await Package.findById(package_id);
    if (!pkg) {
      return apiResponse.notFound("Package not found");
    }

    if (pkg.target_role !== "MERCHANT") {
      return apiResponse.error("This package is not for merchants");
    }

    // Refresh user data to get latest balance
    const freshUser = await User.findById(user!._id);
    if (!freshUser) return apiResponse.notFound("User not found");

    // Check TM balance
    if ((freshUser.tm_balance || 0) < pkg.price) {
      return apiResponse.error(
        `Số dư TM không đủ. Cần ${pkg.price.toLocaleString()} TM, hiện có ${freshUser.tm_balance?.toLocaleString() || 0
        } TM.`
      );
    }

    // Check for downgrade to prepare notification message
    let isDowngrade = false;
    let oldPackageName = "";
    const existingSub = freshUser.subscription;
    if (
      existingSub?.package_id &&
      existingSub?.expired_at &&
      new Date(existingSub.expired_at) > new Date()
    ) {
      const existingPkg = await Package.findById(existingSub.package_id).lean();
      if (existingPkg && existingSub.package_id.toString() !== pkg._id.toString()) {
        if (existingPkg.price > pkg.price) {
          isDowngrade = true;
          oldPackageName = existingPkg.name;
        }
      }
    }

    // Calculate subscription dates
    // Fix: Always start from purchase time (TODAY) as requested by the user
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + pkg.duration_months);

    // --- Bug 1 Fix: Atomic balance deduction using $inc ---
    // Use atomic findOneAndUpdate with a balance check condition to prevent race conditions.
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: user!._id,
        tm_balance: { $gte: pkg.price }, // Atomic check: only update if balance is sufficient
      },
      {
        $inc: { tm_balance: -pkg.price },
        $set: {
          // --- Bug 2 Fix: Store only package_id + dates. No denormalized features[].
          // Guards read features_config directly from Package collection at runtime.
          subscription: {
            package_id: pkg._id,
            started_at: startDate,
            expired_at: endDate,
          },
        },
      },
      { new: true }
    );

    // If updatedUser is null, the atomic balance check failed (race condition caught)
    if (!updatedUser) {
      return apiResponse.error(
        "Số dư TM không đủ hoặc đã có thao tác khác. Vui lòng thử lại."
      );
    }

    // Create transaction record for TM payment
    const transaction = await Transaction.create({
      user_id: user!._id,
      type: TransactionType.SUBSCRIPTION,
      reference_id: pkg._id,
      amount: pkg.price,
      transaction_code: `TM_SUB_M_${Date.now()}`,
      status: TransactionStatus.SUCCESS,
      paid_at: new Date(),
      expire_at: new Date(), // Already paid
    });

    // Log subscription payment
    const subscriptionLog = await SubscriptionLog.create({
      user_id: user!._id,
      package_id: pkg._id,
      amount: pkg.price,
      payment_gateway_id: `TM_WALLET_${transaction._id}`,
      status: "SUCCESS",
    });

    // Send notification
    try {
      await createNotification({
        userId: user!._id.toString(),
        type: NotificationType.SUBSCRIPTION,
        title: isDowngrade ? "Thay đổi gói dịch vụ" : "Nâng cấp thành công",
        message: isDowngrade
          ? `Cửa hàng của bạn đã chuyển xuống gói "${pkg.name}". Các giới hạn mới đã được áp dụng.`
          : `Chúc mừng! Cửa hàng của bạn đã kích hoạt gói "${pkg.name}". Hạn dùng đến ${endDate.toLocaleDateString("vi-VN")}.`,
        redirectUrl: "/dashboard/merchant/subscription",
        referenceId: pkg._id.toString(),
      });
    } catch (notifError) {
      console.error("Failed to send subscription notification:", notifError);
    }

    return apiResponse.success(
      {
        subscription: {
          package_name: pkg.name,
          started_at: startDate,
          expired_at: endDate,
        },
        payment_log_id: subscriptionLog._id,
      },
      "Đăng ký gói thành công!"
    );
  } catch (error) {
    console.error("Subscribe merchant error:", error);
    return apiResponse.serverError("Subscription failed");
  }
}
