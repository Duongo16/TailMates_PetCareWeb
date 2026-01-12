import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Service from "@/models/Service";
import { authenticate, authorize, apiResponse } from "@/lib/auth";
import { UserRole } from "@/models/User";
import mongoose from "mongoose";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/v1/merchant/services/[id] - Update service
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    const authError = authorize(user!, [UserRole.MERCHANT]);
    if (authError) return authError;

    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiResponse.error("Invalid service ID");
    }

    const service = await Service.findOne({
      _id: id,
      merchant_id: user!._id,
    });

    if (!service) {
      return apiResponse.notFound("Service not found");
    }

    const body = await request.json();
    const updateFields = [
      "name",
      "price_min",
      "price_max",
      "duration_minutes",
      "description",
      "image",
      "is_active",
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of updateFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const updatedService = await Service.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    return apiResponse.success(updatedService, "Service updated successfully");
  } catch (error) {
    console.error("Update service error:", error);
    return apiResponse.serverError("Failed to update service");
  }
}

// DELETE /api/v1/merchant/services/[id] - Delete service
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    const authError = authorize(user!, [UserRole.MERCHANT]);
    if (authError) return authError;

    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiResponse.error("Invalid service ID");
    }

    const service = await Service.findOne({
      _id: id,
      merchant_id: user!._id,
    });

    if (!service) {
      return apiResponse.notFound("Service not found");
    }

    await Service.findByIdAndDelete(id);

    return apiResponse.success(null, "Service deleted successfully");
  } catch (error) {
    console.error("Delete service error:", error);
    return apiResponse.serverError("Failed to delete service");
  }
}
