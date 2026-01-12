import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Order from "@/models/Order";
import User from "@/models/User";
import { authenticate, authorize, apiResponse } from "@/lib/auth";
import { UserRole } from "@/models/User";
import mongoose from "mongoose";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/v1/orders/[id]/status - Update order status (merchant only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    const authError = authorize(user!, [UserRole.MERCHANT, UserRole.MANAGER, UserRole.ADMIN]);
    if (authError) return authError;

    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiResponse.error("Invalid order ID");
    }

    const order = await Order.findById(id);

    if (!order) {
      return apiResponse.notFound("Order not found");
    }

    // Merchant can only update their own orders
    if (
      user!.role === UserRole.MERCHANT &&
      order.merchant_id.toString() !== user!._id.toString()
    ) {
      return apiResponse.forbidden("You can only update your own orders");
    }

    const body = await request.json();
    const { status } = body;

    const validStatuses = ["PENDING", "CONFIRMED", "SHIPPING", "COMPLETED", "CANCELLED"];
    if (!status || !validStatuses.includes(status)) {
      return apiResponse.error(
        `Invalid status. Valid values: ${validStatuses.join(", ")}`
      );
    }

    // Update order status
    order.status = status;
    await order.save();

    // If completed, update merchant revenue
    if (status === "COMPLETED") {
      await User.findByIdAndUpdate(order.merchant_id, {
        $inc: { "merchant_profile.revenue_stats": order.total_amount },
      });
    }

    return apiResponse.success(order, "Order status updated successfully");
  } catch (error) {
    console.error("Update order status error:", error);
    return apiResponse.serverError("Failed to update order status");
  }
}
