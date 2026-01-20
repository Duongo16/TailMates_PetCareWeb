import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Booking from "@/models/Booking";
import { authenticate, authorize, apiResponse } from "@/lib/auth";
import { UserRole } from "@/models/User";
import mongoose from "mongoose";
import {
  createNotification,
  NotificationType,
  getBookingStatusTitle,
  getBookingStatusMessage,
} from "@/lib/notification-service";

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

    const booking = await Booking.findById(id).populate("service_id", "name");

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

    const previousStatus = booking.status;
    booking.status = status;
    await booking.save();

    // Create notification for customer (only when merchant/admin updates)
    if (!isCustomer && previousStatus !== status) {
      const serviceName = (booking.service_id as any)?.name;
      await createNotification({
        userId: booking.customer_id.toString(),
        type: NotificationType.BOOKING_UPDATE,
        title: getBookingStatusTitle(status),
        message: getBookingStatusMessage(booking._id.toString(), status, serviceName),
        redirectUrl: "/dashboard?tab=bookings",
        referenceId: booking._id.toString(),
      });
    }

    return apiResponse.success(booking, "Booking status updated successfully");
  } catch (error) {
    console.error("Update booking status error:", error);
    return apiResponse.serverError("Failed to update booking status");
  }
}

