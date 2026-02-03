import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import User, { UserRole, AuthProvider } from "@/models/User";
import { generateTokenPair, apiResponse } from "@/lib/auth";
import { verifyGoogleToken, isGoogleAuthConfigured } from "@/lib/google-oauth";

/**
 * POST /api/v1/auth/google
 * Handle Google OAuth login/registration with account linking
 */
export async function POST(request: NextRequest) {
  try {
    // Check if Google OAuth is configured
    if (!isGoogleAuthConfigured()) {
      return apiResponse.error(
        "Google OAuth chưa được cấu hình",
        503
      );
    }

    const body = await request.json();
    const { id_token } = body;

    // Validation
    if (!id_token) {
      return apiResponse.error("Google ID token là bắt buộc");
    }

    // Verify Google token
    const googleUser = await verifyGoogleToken(id_token);
    if (!googleUser) {
      return apiResponse.unauthorized(
        "Google token không hợp lệ hoặc đã hết hạn",
        "INVALID_GOOGLE_TOKEN"
      );
    }

    await connectDB();

    // Look for existing user by google_id or email
    let user = await User.findOne({
      $or: [
        { google_id: googleUser.googleId },
        { email: googleUser.email.toLowerCase() },
      ],
    });

    let isNewUser = false;
    let accountLinked = false;

    if (user) {
      // User exists
      if (!user.is_active) {
        return apiResponse.forbidden("Tài khoản đã bị vô hiệu hóa");
      }

      // Account linking: If user exists with email but different provider
      if (user.auth_provider === AuthProvider.EMAIL && !user.google_id) {
        // Link Google account to existing email account
        user.google_id = googleUser.googleId;
        user.is_email_verified = true; // Google emails are verified
        
        // Update avatar if not set
        if (!user.avatar && googleUser.picture) {
          user.avatar = {
            url: googleUser.picture,
            public_id: `google_${googleUser.googleId}`,
          };
        }
        
        await user.save();
        accountLinked = true;
        console.log(`Linked Google account to existing user: ${user.email}`);
      } else if (user.google_id !== googleUser.googleId) {
        // Different Google account trying to use same email
        return apiResponse.error(
          "Email này đã được liên kết với tài khoản Google khác",
          409
        );
      }
    } else {
      // Create new user
      isNewUser = true;

      user = await User.create({
        email: googleUser.email.toLowerCase(),
        full_name: googleUser.name,
        google_id: googleUser.googleId,
        auth_provider: AuthProvider.GOOGLE,
        is_email_verified: true,
        is_active: true,
        role: UserRole.CUSTOMER,
        refresh_token_version: 0,
        avatar: googleUser.picture
          ? {
              url: googleUser.picture,
              public_id: `google_${googleUser.googleId}`,
            }
          : undefined,
      });

      console.log(`Created new user via Google OAuth: ${user.email}`);
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair(user);

    // Return user info
    const userResponse = {
      id: user._id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      avatar: user.avatar,
      is_active: user.is_active,
      is_email_verified: user.is_email_verified,
      auth_provider: user.auth_provider,
    };

    return apiResponse.success(
      {
        user: userResponse,
        accessToken,
        refreshToken,
        isNewUser,
        accountLinked,
      },
      isNewUser
        ? "Đăng ký thành công với Google"
        : accountLinked
        ? "Đăng nhập thành công. Tài khoản Google đã được liên kết."
        : "Đăng nhập thành công với Google"
    );
  } catch (error) {
    console.error("Google auth error:", error);
    return apiResponse.serverError("Đã xảy ra lỗi khi xác thực với Google");
  }
}
