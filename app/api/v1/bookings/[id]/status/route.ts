import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Booking from "@/models/Booking";
import { authenticate, authorize, apiResponse } from "@/lib/auth";
import { UserRole } from "@/models/User";
import mongoose from "mongoose";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/v1/bookings/[id]/status - Update booking status
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    const authError = authorize(user!, [
      UserRole.MERCHANT,
      UserRole.CUSTOMER,
      UserRole.MANAGER,
      UserRole.ADMIN,
    ]);
    if (authError) return authError;

    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiResponse.error("Invalid booking ID");
    }

    const booking = await Booking.findById(id);

    if (!booking) {
      return apiResponse.notFound("Booking not found");
    }

    // Check permissions
    const isCustomer =
      user!.role === UserRole.CUSTOMER &&
      booking.customer_id.toString() === user!._id.toString();
    const isMerchant =
      user!.role === UserRole.MERCHANT &&
      booking.merchant_id.toString() === user!._id.toString();
    const isAdmin =
      user!.role === UserRole.MANAGER || user!.role === UserRole.ADMIN;

    if (!isCustomer && !isMerchant && !isAdmin) {
      return apiResponse.forbidden("You cannot update this booking");
    }

    const body = await request.json();
    const { status } = body;

    const validStatuses = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];
    if (!status || !validStatuses.includes(status)) {
      return apiResponse.error(
        `Invalid status. Valid values: ${validStatuses.join(", ")}`
      );
    }

    // Customer can only cancel
    if (isCustomer && status !== "CANCELLED") {
      return apiResponse.error("You can only cancel your booking");
    }

    booking.status = status;
    await booking.save();

    return apiResponse.success(booking, "Booking status updated successfully");
  } catch (error) {
    console.error("Update booking status error:", error);
    return apiResponse.serverError("Failed to update booking status");
  }
}
