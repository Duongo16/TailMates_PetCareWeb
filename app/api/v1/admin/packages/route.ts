import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Package from "@/models/Package";
import { authenticate, authorize, apiResponse } from "@/lib/auth";
import { UserRole } from "@/models/User";

// GET /api/v1/admin/packages - Get all packages (admin only)
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    const authError = authorize(user!, [UserRole.ADMIN, UserRole.MANAGER]);
    if (authError) return authError;

    await connectDB();

    const packages = await Package.find({}).sort({ target_role: 1, price: 1 });

    return apiResponse.success(packages);
  } catch (error) {
    console.error("Get admin packages error:", error);
    return apiResponse.serverError("Failed to get packages");
  }
}

// POST /api/v1/admin/packages - Create package (admin only)
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    const authError = authorize(user!, [UserRole.ADMIN]);
    if (authError) return authError;

    await connectDB();

    const body = await request.json();
    const {
      name,
      target_role,
      price,
      duration_months,
      description,
      features_config,
    } = body;

    if (!name || !target_role || price === undefined || !duration_months) {
      return apiResponse.error(
        "Name, target_role, price, and duration_months are required"
      );
    }

    const validRoles = ["CUSTOMER", "MERCHANT"];
    if (!validRoles.includes(target_role)) {
      return apiResponse.error("target_role must be CUSTOMER or MERCHANT");
    }

    const newPackage = await Package.create({
      name,
      target_role,
      price,
      duration_months,
      description,
      features_config: features_config || {
        ai_limit_per_day: 5,
        max_pets: 1,
        priority_support: false,
        pawmate_connect: false,
        blog_posting: false,
        ai_personality: false,
        ai_recommendations: false,
      },
      is_active: true,
    });

    return apiResponse.created(newPackage, "Package created successfully");
  } catch (error) {
    console.error("Create package error:", error);
    return apiResponse.serverError("Failed to create package");
  }
}
