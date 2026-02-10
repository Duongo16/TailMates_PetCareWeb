import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/db";
import User, { IUser, UserRole } from "@/models/User";

// ==================== Configuration ====================
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET + "-refresh";
const ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

// ==================== Interfaces ====================
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  type: "access" | "refresh";
  version?: number; // For refresh token invalidation
}

export interface AuthenticatedRequest extends NextRequest {
  user?: IUser;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// ==================== Token Generation ====================

/**
 * Generate Access Token (short-lived, 15 minutes default)
 */
export function generateAccessToken(user: IUser): string {
  const payload: JWTPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    type: "access",
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

/**
 * Generate Refresh Token (long-lived, 7 days default)
 * Includes version for token invalidation
 */
export function generateRefreshToken(user: IUser): string {
  const payload: JWTPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    type: "refresh",
    version: user.refresh_token_version || 0,
  };

  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
}

/**
 * Generate both Access and Refresh tokens
 */
export function generateTokenPair(user: IUser): TokenPair {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
  };
}

/**
 * Legacy function - Generate single token (for backward compatibility)
 * @deprecated Use generateTokenPair instead
 */
export function generateToken(user: IUser): string {
  return generateAccessToken(user);
}

// ==================== Token Verification ====================

/**
 * Verify Access Token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    if (decoded.type && decoded.type !== "access") {
      return null; // Wrong token type
    }
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Verify Refresh Token
 * Returns payload with additional error info
 */
export function verifyRefreshToken(
  token: string
): { payload: JWTPayload | null; error?: "expired" | "invalid" | "wrong_type" } {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
    if (decoded.type !== "refresh") {
      return { payload: null, error: "wrong_type" };
    }
    return { payload: decoded };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return { payload: null, error: "expired" };
    }
    return { payload: null, error: "invalid" };
  }
}

/**
 * Parse token expiration error for better error messages
 */
export function getTokenError(token: string): "expired" | "invalid" | null {
  try {
    jwt.verify(token, JWT_SECRET);
    return null;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return "expired";
    }
    return "invalid";
  }
}

// ==================== Request Utilities ====================

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

// ==================== Authentication Middleware ====================

/**
 * Authentication middleware - verify token and attach user to request
 * Enhanced with specific error codes for token issues
 */
export async function authenticate(
  request: NextRequest
): Promise<{ user: IUser | null; error: NextResponse | null }> {
  const token = extractToken(request);

  if (!token) {
    return {
      user: null,
      error: NextResponse.json(
        { success: false, message: "Unauthorized - No token provided", code: "NO_TOKEN" },
        { status: 401 }
      ),
    };
  }

  // Check for expired vs invalid token
  const tokenError = getTokenError(token);
  if (tokenError === "expired") {
    return {
      user: null,
      error: NextResponse.json(
        { success: false, message: "Token expired", code: "TOKEN_EXPIRED" },
        { status: 401 }
      ),
    };
  }

  const payload = verifyToken(token);
  if (!payload) {
    return {
      user: null,
      error: NextResponse.json(
        { success: false, message: "Invalid token", code: "INVALID_TOKEN" },
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

// ==================== Authorization Middleware ====================

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

// ==================== API Response Helpers ====================

export const apiResponse = {
  success: (data: unknown, message = "Success", status = 200) =>
    NextResponse.json({ success: true, message, data }, { status }),

  error: (message: string, status = 400, code?: string) =>
    NextResponse.json({ success: false, message, code }, { status }),

  badRequest: (message = "Bad request") =>
    NextResponse.json({ success: false, message }, { status: 400 }),

  created: (data: unknown, message = "Created successfully") =>
    NextResponse.json({ success: true, message, data }, { status: 201 }),

  notFound: (message = "Resource not found") =>
    NextResponse.json({ success: false, message }, { status: 404 }),

  unauthorized: (message = "Unauthorized", code?: string) =>
    NextResponse.json({ success: false, message, code }, { status: 401 }),

  forbidden: (message = "Forbidden") =>
    NextResponse.json({ success: false, message }, { status: 403 }),

  serverError: (message = "Internal server error") =>
    NextResponse.json({ success: false, message }, { status: 500 }),

  tooManyRequests: (message = "Too many requests", retryAfter?: number) =>
    NextResponse.json(
      { success: false, message, retryAfter },
      { status: 429 }
    ),
};
