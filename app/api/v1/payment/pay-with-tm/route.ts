import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Transaction, {
  TransactionType,
  TransactionStatus,
} from "@/models/Transaction";
import User from "@/models/User";
import Package from "@/models/Package";
import Order, { OrderStatus } from "@/models/Order";
import SubscriptionLog from "@/models/SubscriptionLog";
import { authenticate, apiResponse } from "@/lib/auth";
import mongoose from "mongoose";
import { createNotification, NotificationType } from "@/lib/notification-service";

// POST /api/v1/payment/pay-with-tm - Pay for service using TM balance
export async function POST(request: NextRequest) {
  try {
    const { user: authUser, error } = await authenticate(request);
    if (error) return error;

    await connectDB();

    const body = await request.json();
    const { type, reference_id } = body;

    // Validate type
    if (!type || ![TransactionType.SUBSCRIPTION, TransactionType.ORDER].includes(type)) {
      return apiResponse.error("Valid type is required (SUBSCRIPTION, ORDER)");
    }

    if (!reference_id || !mongoose.Types.ObjectId.isValid(reference_id)) {
      return apiResponse.error("Valid reference_id is required");
    }

    // Refresh user data to get latest balance
    const user = await User.findById(authUser!._id);
    if (!user) return apiResponse.notFound("User not found");

    let amount = 0;
    let pkg = null;
    let order = null;

    // Get amount based on type
    if (type === TransactionType.SUBSCRIPTION) {
      pkg = await Package.findById(reference_id);
      if (!pkg) return apiResponse.notFound("Package not found");
      amount = pkg.price;
    } else if (type === TransactionType.ORDER) {
      order = await Order.findById(reference_id);
      if (!order) return apiResponse.notFound("Order not found");

      if (order.status !== OrderStatus.PENDING) {
        return apiResponse.error("Order is already processed");
      }
      amount = order.total_amount;
    }

    // Check balance
    if ((user.tm_balance || 0) < amount) {
      return apiResponse.error(`Số dư TM không đủ. Cần ${amount.toLocaleString()} TM, hiện có ${user.tm_balance?.toLocaleString() || 0} TM.`);
    }

    // Check for downgrade to prepare notification message
    let isDowngrade = false;
    let oldPackageName = "";
    if (type === TransactionType.SUBSCRIPTION && pkg) {
      const existingSub = user.subscription;
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
    }

    // --- Bug 1 Fix: Atomic balance deduction using $inc ---
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: user._id,
        tm_balance: { $gte: amount }, // Atomic check
      },
      { $inc: { tm_balance: -amount } },
      { new: true }
    );

    if (!updatedUser) {
      return apiResponse.error(
        "Số dư TM không đủ hoặc đã có thao tác khác. Vui lòng thử lại."
      );
    }

    // Create transaction record
    const transaction = await Transaction.create({
      user_id: user._id,
      type,
      reference_id: new mongoose.Types.ObjectId(reference_id),
      amount,
      transaction_code: `TM_PAY_${Date.now()}`,
      status: TransactionStatus.SUCCESS,
      paid_at: new Date(),
      expire_at: new Date(), // Already paid
    });

    // Process the service
    if (type === TransactionType.SUBSCRIPTION && pkg) {
      // Fix: Always start from purchase time (TODAY) as requested by the user
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + pkg.duration_months);

      await User.findByIdAndUpdate(user._id, {
        $set: {
          subscription: {
            package_id: pkg._id,
            started_at: startDate,
            expired_at: endDate,
          },
        },
      });

      await SubscriptionLog.create({
        user_id: user._id,
        package_id: pkg._id as mongoose.Types.ObjectId,
        amount: amount,
        payment_gateway_id: `TM_WALLET_${transaction._id}`,
        status: "SUCCESS",
      });

      // Send notification
      try {
        await createNotification({
          userId: user._id.toString(),
          type: NotificationType.SUBSCRIPTION,
          title: isDowngrade ? "Thay đổi gói dịch vụ" : "Nâng cấp thành công",
          message: isDowngrade
            ? `Tài khoản của bạn đã chuyển sang gói "${pkg.name}". Các quyền lợi mới đã được áp dụng.`
            : `Chúc mừng! Bạn đã đăng ký thành công gói "${pkg.name}". Hạn dùng đến ${endDate.toLocaleDateString("vi-VN")}.`,
          redirectUrl: user.role === "MERCHANT" ? "/dashboard/merchant/subscription" : "/dashboard/customer?tab=subscription",
          referenceId: pkg._id.toString(),
        });
      } catch (notifError) {
        console.error("Failed to send subscription notification:", notifError);
      }
    } else if (type === TransactionType.ORDER && order) {
      await Order.findByIdAndUpdate(reference_id, {
        $set: { status: OrderStatus.CONFIRMED },
      });
    }

    return apiResponse.success(
      {
        transaction_id: transaction._id,
        new_balance: user.tm_balance,
      },
      "Thanh toán bằng TM thành công"
    );
  } catch (error) {
    console.error("Pay with TM error:", error);
    return apiResponse.serverError("Failed to pay with TM");
  }
}
