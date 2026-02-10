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

    // Deduct balance and process transaction
    // Use a transaction or session if possible, but for simplicity here we use sequential updates
    user.tm_balance = (user.tm_balance || 0) - amount;
    await user.save();

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
      // Logic from webhook
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + pkg.duration_months);

      const features: string[] = [];
      if (pkg.features_config.priority_support) features.push("PRIORITY_SUPPORT");
      if (pkg.features_config.ai_limit_per_day >= 100) features.push("UNLIMITED_AI");
      if (pkg.features_config.max_pets >= 10) features.push("UNLIMITED_PETS");

      user.subscription = {
        package_id: pkg._id as mongoose.Types.ObjectId,
        started_at: startDate,
        expired_at: endDate,
        features,
      };
      await user.save();

      await SubscriptionLog.create({
        user_id: user._id,
        package_id: pkg._id as mongoose.Types.ObjectId,
        amount: amount,
        payment_gateway_id: `TM_VALLET_${transaction._id}`,
        status: "SUCCESS",
      });
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
