import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Package from "@/models/Package";
import { apiResponse } from "@/lib/auth";

// GET /api/v1/packages-customer - Get packages for customers (public)
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const packages = await Package.find({
      target_role: "CUSTOMER",
      is_active: true,
    }).sort({ order: 1, price: 1 });

    return apiResponse.success(packages);
  } catch (error) {
    console.error("Get customer packages error:", error);
    return apiResponse.serverError("Failed to get packages");
  }
}
