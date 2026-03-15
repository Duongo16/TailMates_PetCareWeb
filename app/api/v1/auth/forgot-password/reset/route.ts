import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { apiResponse } from "@/lib/auth";
import { clearOTPData } from "@/lib/otp-service";

/**
 * POST /api/v1/auth/forgot-password/reset
 * Reset password after OTP verification
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { email, new_password } = body;

    // Validation
    if (!email || !new_password) {
      return apiResponse.error("Email và mật khẩu mới là bắt buộc");
    }

    const emailLower = email.toLowerCase().trim();

    if (new_password.length < 6) {
      return apiResponse.error("Mật khẩu mới phải có ít nhất 6 ký tự");
    }

    // Find user
    const user = await User.findOne({ email: emailLower });
    if (!user) {
      return apiResponse.error("Không tìm thấy tài khoản", 404);
    }

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(new_password, 10);
    user.password = hashedPassword;
    await user.save();

    // Clean up any remaining OTP data
    await clearOTPData(emailLower);

    return apiResponse.success(
      { email: emailLower },
      "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại."
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return apiResponse.serverError("Đã xảy ra lỗi khi đặt lại mật khẩu");
  }
}
