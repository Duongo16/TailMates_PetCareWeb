import { NextRequest } from "next/server";
import { apiResponse } from "@/lib/auth";
import { verifyOTP } from "@/lib/otp-service";

/**
 * POST /api/v1/auth/forgot-password/verify-otp
 * Verify OTP for password reset
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    // Validation
    if (!email || !otp) {
      return apiResponse.error("Email và mã OTP là bắt buộc");
    }

    const emailLower = email.toLowerCase().trim();
    const otpTrimmed = otp.trim();

    if (otpTrimmed.length !== 6) {
      return apiResponse.error("Mã OTP không hợp lệ");
    }

    // Verify OTP
    const otpResult = await verifyOTP(emailLower, otpTrimmed);
    if (!otpResult.valid) {
      return apiResponse.error(otpResult.error || "Mã OTP không hợp lệ", 400);
    }

    return apiResponse.success(
      { email: emailLower, verified: true },
      "OTP xác thực thành công. Bạn có thể đặt lại mật khẩu."
    );
  } catch (error) {
    console.error("Forgot password verify OTP error:", error);
    return apiResponse.serverError("Đã xảy ra lỗi khi xác thực OTP");
  }
}
