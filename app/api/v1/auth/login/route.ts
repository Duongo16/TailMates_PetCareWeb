import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { generateToken, apiResponse } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return apiResponse.error("Email and password are required");
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return apiResponse.error("Invalid email or password", 401);
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return apiResponse.error("Invalid email or password", 401);
    }

    // Check if account is active
    if (!user.is_active) {
      return apiResponse.error(
        "Account is not active. Please contact support.",
        403
      );
    }

    // Generate token
    const token = generateToken(user);

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
    };

    return apiResponse.success(
      { user: userResponse, token },
      "Login successful"
    );
  } catch (error) {
    console.error("Login error:", error);
    return apiResponse.serverError("Login failed");
  }
}
