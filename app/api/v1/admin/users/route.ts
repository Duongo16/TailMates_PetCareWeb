import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { authenticate, authorize, apiResponse } from "@/lib/auth";
import { UserRole } from "@/models/User";

// GET /api/v1/admin/users - List all users (Admin only)
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    const roleError = authorize(user!, [UserRole.ADMIN]);
    if (roleError) return roleError;

    await connectDB();

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const query: any = {};
    if (role) query.role = role.toUpperCase();
    if (status === "active") query.is_active = true;
    if (status === "pending") query.is_active = false;

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password -password_hash")
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    // Get stats
    const [customerCount, merchantCount, activeCount, pendingCount] = await Promise.all([
      User.countDocuments({ role: "CUSTOMER" }),
      User.countDocuments({ role: "MERCHANT" }),
      User.countDocuments({ is_active: true }),
      User.countDocuments({ is_active: false }),
    ]);

    return apiResponse.success({
      users,
      stats: {
        total,
        customers: customerCount,
        merchants: merchantCount,
        active: activeCount,
        pending: pendingCount,
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin get users error:", error);
    return apiResponse.serverError("Failed to fetch users");
  }
}

// PATCH /api/v1/admin/users - Update user status (Admin only)
export async function PATCH(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    const roleError = authorize(user!, [UserRole.ADMIN]);
    if (roleError) return roleError;

    await connectDB();
    const body = await request.json();
    const { user_id, is_active, role } = body;

    if (!user_id) {
      return apiResponse.error("user_id is required");
    }

    const targetUser = await User.findById(user_id);
    if (!targetUser) {
      return apiResponse.notFound("User not found");
    }

    if (is_active !== undefined) targetUser.is_active = is_active;
    if (role) targetUser.role = role.toUpperCase();

    await targetUser.save();

    return apiResponse.success(
      { id: targetUser._id, is_active: targetUser.is_active, role: targetUser.role },
      "User updated successfully"
    );
  } catch (error) {
    console.error("Admin update user error:", error);
    return apiResponse.serverError("Failed to update user");
  }
}
