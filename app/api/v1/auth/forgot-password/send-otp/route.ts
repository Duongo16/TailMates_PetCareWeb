import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import User, { AuthProvider } from "@/models/User";
import { apiResponse } from "@/lib/auth";
import { 
  generateOTP, 
  storeOTP, 
  checkOTPRateLimit 
} from "@/lib/otp-service";
import { sendPasswordResetOTPEmail } from "@/lib/email-service";

/**
 * POST /api/v1/auth/forgot-password/send-otp
 * Send OTP to email for password reset verification
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { email } = body;

    // Validation
    if (!email) {
      return apiResponse.error("Email là bắt buộc");
    }

    const emailLower = email.toLowerCase().trim();

    // Check if user exists
    const user = await User.findOne({ email: emailLower });
    if (!user) {
      // Don't reveal if email exists or not for security
      // But return success anyway to prevent email enumeration
      return apiResponse.success(
        { email: emailLower, waitSeconds: 60 },
        "Nếu email tồn tại, mã OTP đã được gửi đến email của bạn"
      );
    }

    // Check if user registered with Google only (no password set)
    if (user.auth_provider === AuthProvider.GOOGLE && !user.password) {
      return apiResponse.error(
        "Tài khoản này được đăng ký bằng Google. Vui lòng đăng nhập bằng Google.",
        400
      );
    }

    // Check rate limit
    const rateCheck = await checkOTPRateLimit(emailLower);
    if (!rateCheck.allowed) {
      return apiResponse.tooManyRequests(
        `Vui lòng đợi ${rateCheck.waitSeconds} giây trước khi gửi lại OTP`,
        rateCheck.waitSeconds
      );
    }

    // Generate and store OTP
    const otp = generateOTP();
    await storeOTP(emailLower, otp);

    // Send OTP email
    const emailResult = await sendPasswordResetOTPEmail(
      emailLower, 
      otp, 
      user.full_name
    );
    if (!emailResult.success) {
      console.error("Failed to send password reset OTP email:", emailResult.error);
      if (process.env.NODE_ENV !== "development") {
        return apiResponse.serverError("Không thể gửi email. Vui lòng thử lại sau.");
      }
    }

    return apiResponse.success(
      { 
        email: emailLower,
        waitSeconds: 60,
      },
      "Mã OTP đã được gửi đến email của bạn"
    );
  } catch (error) {
    console.error("Forgot password send OTP error:", error);
    return apiResponse.serverError("Đã xảy ra lỗi khi gửi OTP");
  }
}
