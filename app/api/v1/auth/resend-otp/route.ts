import { NextRequest } from "next/server";
import { apiResponse } from "@/lib/auth";
import { 
  generateOTP, 
  storeOTP, 
  checkOTPRateLimit, 
  getPendingRegistration 
} from "@/lib/otp-service";
import { sendOTPEmail } from "@/lib/email-service";
import { getRedisClient, REDIS_KEYS } from "@/lib/redis";

/**
 * POST /api/v1/auth/resend-otp
 * Resend OTP for registration (with rate limiting)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validation
    if (!email) {
      return apiResponse.error("Email là bắt buộc");
    }

    const emailLower = email.toLowerCase().trim();

    // Check if there's a pending registration
    const pendingData = await getPendingRegistration(emailLower);
    if (!pendingData) {
      return apiResponse.error(
        "Không tìm thấy phiên đăng ký. Vui lòng bắt đầu lại từ đầu.",
        404
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

    // Generate and store new OTP
    const otp = generateOTP();
    await storeOTP(emailLower, otp);
    
    // Clear failed attempts when resending
    const redis = getRedisClient();
    await redis.del(REDIS_KEYS.OTP_ATTEMPTS(emailLower));

    // Send OTP email
    const emailResult = await sendOTPEmail(emailLower, otp, pendingData.full_name);
    if (!emailResult.success) {
      console.error("Failed to resend OTP email:", emailResult.error);
      if (process.env.NODE_ENV !== "development") {
        return apiResponse.serverError("Không thể gửi email. Vui lòng thử lại sau.");
      }
    }

    return apiResponse.success(
      { 
        email: emailLower,
        waitSeconds: 60,
      },
      "Mã OTP mới đã được gửi đến email của bạn"
    );
  } catch (error) {
    console.error("Resend OTP error:", error);
    return apiResponse.serverError("Đã xảy ra lỗi khi gửi lại OTP");
  }
}
