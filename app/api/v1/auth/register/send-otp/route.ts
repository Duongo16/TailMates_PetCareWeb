import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import User, { UserRole, AuthProvider } from "@/models/User";
import { apiResponse } from "@/lib/auth";
import { 
  generateOTP, 
  storeOTP, 
  checkOTPRateLimit, 
  storePendingRegistration 
} from "@/lib/otp-service";
import { sendOTPEmail } from "@/lib/email-service";

/**
 * POST /api/v1/auth/register/send-otp
 * Send OTP to email for registration verification
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { email, password, full_name, phone_number, role, shop_name, address, terms_accepted } = body;

    // Validation
    if (!email || !password || !full_name) {
      return apiResponse.error("Email, password và họ tên là bắt buộc");
    }

    if (!terms_accepted) {
      return apiResponse.error("Bạn phải đồng ý với điều khoản sử dụng");
    }

    if (password.length < 6) {
      return apiResponse.error("Mật khẩu phải có ít nhất 6 ký tự");
    }

    const emailLower = email.toLowerCase().trim();

    // Check if email already registered
    const existingUser = await User.findOne({ email: emailLower });
    if (existingUser) {
      // Check if user registered with Google
      if (existingUser.auth_provider === AuthProvider.GOOGLE) {
        return apiResponse.error(
          "Email này đã đăng ký bằng Google. Vui lòng đăng nhập bằng Google.",
          409
        );
      }
      return apiResponse.error("Email đã được đăng ký", 409);
    }

    // Check rate limit
    const rateCheck = await checkOTPRateLimit(emailLower);
    if (!rateCheck.allowed) {
      return apiResponse.tooManyRequests(
        `Vui lòng đợi ${rateCheck.waitSeconds} giây trước khi gửi lại OTP`,
        rateCheck.waitSeconds
      );
    }

    // Validate role
    const allowedRoles: UserRole[] = [UserRole.CUSTOMER, UserRole.MERCHANT];
    const userRole = role && allowedRoles.includes(role) ? role : UserRole.CUSTOMER;

    // Validate merchant data
    if (userRole === UserRole.MERCHANT && (!shop_name?.trim() || !address?.trim())) {
      return apiResponse.error("Tên cửa hàng và địa chỉ là bắt buộc cho tài khoản đối tác");
    }

    // Generate and store OTP
    const otp = generateOTP();
    await storeOTP(emailLower, otp);

    // Hash password and store pending registration
    const hashedPassword = await bcrypt.hash(password, 10);
    await storePendingRegistration(emailLower, {
      full_name: full_name.trim(),
      password_hash: hashedPassword,
      role: userRole,
      phone_number: phone_number?.trim(),
      shop_name: shop_name?.trim(),
      address: address?.trim(),
    });

    // Send OTP email
    const emailResult = await sendOTPEmail(emailLower, otp, full_name.trim());
    if (!emailResult.success) {
      console.error("Failed to send OTP email:", emailResult.error);
      // In development, continue anyway since OTP is logged
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
    console.error("Send OTP error:", error);
    return apiResponse.serverError("Đã xảy ra lỗi khi gửi OTP");
  }
}
