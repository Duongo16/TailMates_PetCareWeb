import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { authenticate, authorize, apiResponse } from "@/lib/auth";
import { UserRole } from "@/models/User";
import mongoose from "mongoose";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/v1/manager/merchants/[id]/status - Approve/Block merchant
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    const authError = authorize(user!, [UserRole.MANAGER, UserRole.ADMIN]);
    if (authError) return authError;

    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiResponse.error("Invalid merchant ID");
    }

    const merchant = await User.findOne({ _id: id, role: "MERCHANT" });

    if (!merchant) {
      return apiResponse.notFound("Merchant not found");
    }

    const body = await request.json();
    const { is_active } = body;

    if (typeof is_active !== "boolean") {
      return apiResponse.error("is_active must be a boolean");
    }

    merchant.is_active = is_active;
    await merchant.save();

    return apiResponse.success(
      {
        id: merchant._id,
        email: merchant.email,
        full_name: merchant.full_name,
        is_active: merchant.is_active,
        merchant_profile: merchant.merchant_profile,
      },
      is_active
        ? "Merchant approved successfully"
        : "Merchant blocked successfully"
    );
  } catch (error) {
    console.error("Update merchant status error:", error);
    return apiResponse.serverError("Failed to update merchant status");
  }
}
