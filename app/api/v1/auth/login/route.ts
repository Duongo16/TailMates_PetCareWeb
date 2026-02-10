import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import User, { AuthProvider } from "@/models/User";
import { generateTokenPair, apiResponse } from "@/lib/auth";

/**
 * POST /api/v1/auth/login
 * Login with email and password
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return apiResponse.error("Email và mật khẩu là bắt buộc");
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return apiResponse.error("Email hoặc mật khẩu không đúng", 401);
    }

    // Check if user registered with Google (no password)
    if (user.auth_provider === AuthProvider.GOOGLE && !user.password) {
      return apiResponse.error(
        "Tài khoản này đã đăng ký bằng Google. Vui lòng đăng nhập bằng Google.",
        400
      );
    }

    // Check password
    if (!user.password) {
      return apiResponse.error("Tài khoản không có mật khẩu", 400);
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return apiResponse.error("Email hoặc mật khẩu không đúng", 401);
    }

    // Check if account is active
    if (!user.is_active) {
      return apiResponse.error(
        "Tài khoản chưa được kích hoạt. Vui lòng liên hệ hỗ trợ.",
        403
      );
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair(user);

    // Return user without password
    const userResponse = {
      id: user._id,
      email: user.email,
      full_name: user.full_name,
      phone_number: user.phone_number,
      role: user.role,
      avatar: user.avatar,
      subscription: user.subscription,
      merchant_profile: user.merchant_profile,
      is_email_verified: user.is_email_verified,
      auth_provider: user.auth_provider,
    };

    return apiResponse.success(
      { user: userResponse, accessToken, refreshToken },
      "Đăng nhập thành công"
    );
  } catch (error) {
    console.error("Login error:", error);
    return apiResponse.serverError("Đăng nhập thất bại");
  }
}
