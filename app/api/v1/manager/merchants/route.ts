import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { authenticate, authorize, apiResponse } from "@/lib/auth";
import { UserRole } from "@/models/User";

// GET /api/v1/manager/merchants - Get all merchants (Manager only)
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    const authError = authorize(user!, [UserRole.MANAGER, UserRole.ADMIN]);
    if (authError) return authError;

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // active, pending, inactive
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const query: Record<string, unknown> = { role: "MERCHANT" };

    if (status === "active") {
      query.is_active = true;
    } else if (status === "pending" || status === "inactive") {
      query.is_active = false;
    }

    const total = await User.countDocuments(query);
    const merchants = await User.find(query)
      .select("-password")
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return apiResponse.success({
      merchants,
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get merchants error:", error);
    return apiResponse.serverError("Failed to get merchants");
  }
}
