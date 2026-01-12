import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Product from "@/models/Product";
import { apiResponse } from "@/lib/auth";

// GET /api/v1/products - Public product listing
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const query: Record<string, unknown> = { is_active: true };

    if (category) {
      query.category = category.toUpperCase();
    }

    if (search) {
      query.$text = { $search: search };
    }

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate("merchant_id", "full_name merchant_profile.shop_name merchant_profile.rating")
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return apiResponse.success({
      products,
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get products error:", error);
    return apiResponse.serverError("Failed to get products");
  }
}
