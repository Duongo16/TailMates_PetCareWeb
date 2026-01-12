import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/db";
import User, { IUser, UserRole } from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key";

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends NextRequest {
  user?: IUser;
}

/**
 * Verify JWT token and return the payload
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Generate JWT token for a user
 */
export function generateToken(user: IUser): string {
  const payload: JWTPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

/**
 * Extract token from Authorization header
 */
export function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Authentication middleware - verify token and attach user to request
 */
export async function authenticate(
  request: NextRequest
): Promise<{ user: IUser | null; error: NextResponse | null }> {
  const token = extractToken(request);

  if (!token) {
    return {
      user: null,
      error: NextResponse.json(
        { success: false, message: "Unauthorized - No token provided" },
        { status: 401 }
      ),
    };
  }

  const payload = verifyToken(token);
  if (!payload) {
    return {
      user: null,
      error: NextResponse.json(
        { success: false, message: "Unauthorized - Invalid token" },
        { status: 401 }
      ),
    };
  }

  try {
    await connectDB();
    const user = await User.findById(payload.userId).select("-password");

    if (!user) {
      return {
        user: null,
        error: NextResponse.json(
          { success: false, message: "User not found" },
          { status: 404 }
        ),
      };
    }

    if (!user.is_active) {
      return {
        user: null,
        error: NextResponse.json(
          { success: false, message: "Account is deactivated" },
          { status: 403 }
        ),
      };
    }

    return { user, error: null };
  } catch {
    return {
      user: null,
      error: NextResponse.json(
        { success: false, message: "Server error during authentication" },
        { status: 500 }
      ),
    };
  }
}

/**
 * Authorization middleware - check if user has required role(s)
 */
export function authorize(
  user: IUser,
  allowedRoles: UserRole[]
): NextResponse | null {
  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json(
      {
        success: false,
        message: `Forbidden - Required role: ${allowedRoles.join(" or ")}`,
      },
      { status: 403 }
    );
  }
  return null;
}

/**
 * Standard API response helpers
 */
export const apiResponse = {
  success: (data: unknown, message = "Success", status = 200) =>
    NextResponse.json({ success: true, message, data }, { status }),

  error: (message: string, status = 400) =>
    NextResponse.json({ success: false, message }, { status }),

  created: (data: unknown, message = "Created successfully") =>
    NextResponse.json({ success: true, message, data }, { status: 201 }),

  notFound: (message = "Resource not found") =>
    NextResponse.json({ success: false, message }, { status: 404 }),

  unauthorized: (message = "Unauthorized") =>
    NextResponse.json({ success: false, message }, { status: 401 }),

  forbidden: (message = "Forbidden") =>
    NextResponse.json({ success: false, message }, { status: 403 }),

  serverError: (message = "Internal server error") =>
    NextResponse.json({ success: false, message }, { status: 500 }),
};
