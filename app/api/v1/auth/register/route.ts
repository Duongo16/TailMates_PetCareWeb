import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import User, { UserRole } from "@/models/User";
import { generateToken, apiResponse } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { email, password, full_name, phone_number, role } = body;

    // Validation
    if (!email || !password || !full_name) {
      return apiResponse.error("Email, password and full name are required");
    }

    if (password.length < 6) {
      return apiResponse.error("Password must be at least 6 characters");
    }

    // Only allow CUSTOMER or MERCHANT registration
    const allowedRoles: UserRole[] = [UserRole.CUSTOMER, UserRole.MERCHANT];
    const userRole = role && allowedRoles.includes(role) ? role : UserRole.CUSTOMER;

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return apiResponse.error("Email already registered", 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userData: Record<string, unknown> = {
      email: email.toLowerCase(),
      password: hashedPassword,
      full_name,
      phone_number,
      role: userRole,
      is_active: userRole === UserRole.CUSTOMER, // Merchant needs approval
    };

    // Add merchant profile if registering as merchant
    if (userRole === UserRole.MERCHANT) {
      userData.merchant_profile = {
        shop_name: body.shop_name || full_name,
        address: body.address || "",
        description: body.description || "",
        rating: 0,
        revenue_stats: 0,
      };
      userData.is_active = false; // Merchant needs Manager approval
    }

    const user = await User.create(userData);

    // Generate token
    const token = generateToken(user);

    // Return user without password
    const userResponse = {
      id: user._id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active,
    };

    return apiResponse.created(
      { user: userResponse, token },
      userRole === UserRole.MERCHANT
        ? "Registration successful. Waiting for approval."
        : "Registration successful"
    );
  } catch (error) {
    console.error("Registration error:", error);
    return apiResponse.serverError("Registration failed");
  }
}
