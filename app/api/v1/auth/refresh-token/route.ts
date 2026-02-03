import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { 
  verifyRefreshToken, 
  generateTokenPair, 
  apiResponse 
} from "@/lib/auth";

/**
 * POST /api/v1/auth/refresh-token
 * Exchange refresh token for new access + refresh tokens
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    // Validation
    if (!refreshToken) {
      return apiResponse.error("Refresh token là bắt buộc");
    }

    // Verify refresh token
    const { payload, error } = verifyRefreshToken(refreshToken);
    
    if (error === "expired") {
      return apiResponse.unauthorized(
        "Refresh token đã hết hạn. Vui lòng đăng nhập lại.",
        "REFRESH_TOKEN_EXPIRED"
      );
    }

    if (error === "wrong_type") {
      return apiResponse.unauthorized(
        "Token không hợp lệ",
        "INVALID_TOKEN_TYPE"
      );
    }

    if (!payload) {
      return apiResponse.unauthorized(
        "Refresh token không hợp lệ",
        "INVALID_REFRESH_TOKEN"
      );
    }

    await connectDB();

    // Find user and verify token version
    const user = await User.findById(payload.userId);
    
    if (!user) {
      return apiResponse.unauthorized(
        "Người dùng không tồn tại",
        "USER_NOT_FOUND"
      );
    }

    if (!user.is_active) {
      return apiResponse.forbidden("Tài khoản đã bị vô hiệu hóa");
    }

    // Check token version (for token invalidation)
    if (payload.version !== user.refresh_token_version) {
      return apiResponse.unauthorized(
        "Token đã bị thu hồi. Vui lòng đăng nhập lại.",
        "TOKEN_REVOKED"
      );
    }

    // Generate new token pair
    const tokens = generateTokenPair(user);

    return apiResponse.success(
      {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
      "Token đã được làm mới"
    );
  } catch (error) {
    console.error("Refresh token error:", error);
    return apiResponse.serverError("Đã xảy ra lỗi khi làm mới token");
  }
}
