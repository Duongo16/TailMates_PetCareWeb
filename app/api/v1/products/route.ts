import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Product from "@/models/Product";
import { apiResponse } from "@/lib/auth";

// GET /api/v1/products - Public product listing with advanced filters
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Advanced filters for specifications
    const targetSpecies = searchParams.get("targetSpecies");
    const lifeStage = searchParams.get("lifeStage");
    const breedSize = searchParams.get("breedSize");
    const healthTags = searchParams.get("healthTags"); // comma-separated
    const isSterilized = searchParams.get("isSterilized");

    const query: Record<string, unknown> = { is_active: true };

    if (category) {
      query.category = category.toUpperCase();
    }

    if (search) {
      // Partial match - contains text (case-insensitive)
      query.name = { $regex: search, $options: "i" };
    }

    // Specifications filters
    if (targetSpecies) {
      query["specifications.targetSpecies"] = targetSpecies.toUpperCase();
    }

    if (lifeStage) {
      query["specifications.lifeStage"] = lifeStage.toUpperCase();
    }

    if (breedSize) {
      query["specifications.breedSize"] = breedSize.toUpperCase();
    }

    if (healthTags) {
      const tags = healthTags.split(",").map(tag => tag.trim());
      query["specifications.healthTags"] = { $all: tags };
    }

    if (isSterilized !== null && isSterilized !== undefined && isSterilized !== "") {
      query["specifications.isSterilized"] = isSterilized === "true";
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

