import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { authenticate, apiResponse } from "@/lib/auth";

/**
 * POST /api/v1/auth/logout
 * Invalidate all refresh tokens for the user
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate request
    const { user, error } = await authenticate(request);
    if (error) return error;
    if (!user) return apiResponse.unauthorized();

    await connectDB();

    // Increment refresh token version to invalidate all existing refresh tokens
    await User.findByIdAndUpdate(user._id, {
      $inc: { refresh_token_version: 1 },
    });

    return apiResponse.success(null, "Đăng xuất thành công");
  } catch (error) {
    console.error("Logout error:", error);
    return apiResponse.serverError("Đã xảy ra lỗi khi đăng xuất");
  }
}
