import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import User, { UserRole, AuthProvider } from "@/models/User";
import { generateTokenPair, apiResponse } from "@/lib/auth";
import { 
  verifyOTP, 
  getPendingRegistration, 
  deletePendingRegistration,
  clearOTPData 
} from "@/lib/otp-service";

/**
 * POST /api/v1/auth/register/verify-otp
 * Verify OTP and complete registration
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

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

    // Get pending registration data
    const pendingData = await getPendingRegistration(emailLower);
    if (!pendingData) {
      return apiResponse.error(
        "Phiên đăng ký đã hết hạn. Vui lòng bắt đầu lại từ đầu.",
        410
      );
    }

    // Double-check email not registered (race condition protection)
    const existingUser = await User.findOne({ email: emailLower });
    if (existingUser) {
      await clearOTPData(emailLower);
      await deletePendingRegistration(emailLower);
      return apiResponse.error("Email đã được đăng ký", 409);
    }

    // Create user data
    const userData: Record<string, unknown> = {
      email: emailLower,
      password: pendingData.password_hash,
      full_name: pendingData.full_name,
      phone_number: pendingData.phone_number,
      role: pendingData.role,
      auth_provider: AuthProvider.EMAIL,
      is_email_verified: true,
      is_active: pendingData.role === UserRole.CUSTOMER, // Merchant needs approval
      refresh_token_version: 0,
    };

    // Add merchant profile if applicable
    if (pendingData.role === UserRole.MERCHANT) {
      userData.merchant_profile = {
        shop_name: pendingData.shop_name || pendingData.full_name,
        address: pendingData.address || "",
        description: "",
        rating: 0,
        revenue_stats: 0,
      };
      userData.is_active = false; // Merchant needs Manager approval
    }

    // Create user
    const user = await User.create(userData);

    // Clean up Redis data
    await deletePendingRegistration(emailLower);

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair(user);

    // Return user info
    const userResponse = {
      id: user._id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active,
      is_email_verified: user.is_email_verified,
      auth_provider: user.auth_provider,
    };

    return apiResponse.created(
      { 
        user: userResponse, 
        accessToken, 
        refreshToken 
      },
      pendingData.role === UserRole.MERCHANT
        ? "Đăng ký thành công. Tài khoản đang chờ duyệt."
        : "Đăng ký thành công"
    );
  } catch (error) {
    console.error("Verify OTP error:", error);
    return apiResponse.serverError("Đã xảy ra lỗi khi xác thực OTP");
  }
}
