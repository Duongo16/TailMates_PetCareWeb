import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import SystemSettings from "@/models/SystemSettings";
import { authenticate, authorize, apiResponse } from "@/lib/auth";
import { UserRole } from "@/models/User";

// GET /api/v1/admin/settings - Get system settings (public)
export async function GET() {
  try {
    await connectDB();
    let settings = await SystemSettings.findOne({ key: "system_settings" });
    if (!settings) {
      settings = await SystemSettings.create({ key: "system_settings" });
    }

    return apiResponse.success({
      topup_maintenance: settings.topup_maintenance,
      topup_maintenance_message: settings.topup_maintenance_message,
    });
  } catch (error) {
    console.error("Get settings error:", error);
    return apiResponse.serverError("Failed to get settings");
  }
}

// PUT /api/v1/admin/settings - Update system settings (admin only)
export async function PUT(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    const authError = authorize(user!, [UserRole.ADMIN]);
    if (authError) return authError;

    await connectDB();

    const body = await request.json();
    const { topup_maintenance, topup_maintenance_message } = body;

    const updateData: Record<string, unknown> = {};
    if (typeof topup_maintenance === "boolean") {
      updateData.topup_maintenance = topup_maintenance;
    }
    if (typeof topup_maintenance_message === "string") {
      updateData.topup_maintenance_message = topup_maintenance_message;
    }

    if (Object.keys(updateData).length === 0) {
      return apiResponse.badRequest("No valid fields to update");
    }

    const settings = await SystemSettings.findOneAndUpdate(
      { key: "system_settings" },
      { $set: updateData },
      { new: true, upsert: true }
    );

    return apiResponse.success({
      topup_maintenance: settings.topup_maintenance,
      topup_maintenance_message: settings.topup_maintenance_message,
    }, "Settings updated successfully");
  } catch (error) {
    console.error("Update settings error:", error);
    return apiResponse.serverError("Failed to update settings");
  }
}
