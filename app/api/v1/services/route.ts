import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Service from "@/models/Service";
import { apiResponse } from "@/lib/auth";

// GET /api/v1/services - Public service listing
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const query: Record<string, unknown> = { is_active: true };

    const total = await Service.countDocuments(query);
    const services = await Service.find(query)
      .populate("merchant_id", "full_name merchant_profile.shop_name merchant_profile.rating merchant_profile.address")
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return apiResponse.success({
      services,
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get services error:", error);
    return apiResponse.serverError("Failed to get services");
  }
}
