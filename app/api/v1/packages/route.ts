import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Package from "@/models/Package";
import { authenticate, authorize, apiResponse } from "@/lib/auth";
import { UserRole } from "@/models/User";

// GET /api/v1/packages - Get all packages (Manager/Admin only)
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    const authError = authorize(user!, [UserRole.MANAGER, UserRole.ADMIN]);
    if (authError) return authError;

    await connectDB();

    const packages = await Package.find().sort({ order: 1, created_at: -1 });

    return apiResponse.success(packages);
  } catch (error) {
    console.error("Get packages error:", error);
    return apiResponse.serverError("Failed to get packages");
  }
}

// POST /api/v1/packages - Create package (Manager/Admin only)
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    const authError = authorize(user!, [UserRole.MANAGER, UserRole.ADMIN]);
    if (authError) return authError;

    await connectDB();

    const body = await request.json();
    const { name, target_role, price, duration_months, features_config, description, benefits, order } = body;

    if (!name || !target_role || price === undefined || !duration_months || !features_config) {
      return apiResponse.error("Missing required fields");
    }

    const newPackage = await Package.create({
      name,
      target_role,
      price,
      duration_months,
      features_config,
      description,
      benefits: benefits || [],
      order: order !== undefined ? order : 0,
      is_active: true,
    });

    return apiResponse.created(newPackage, "Package created successfully");
  } catch (error) {
    console.error("Create package error:", error);
    return apiResponse.serverError("Failed to create package");
  }
}
