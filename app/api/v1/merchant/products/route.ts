import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Product from "@/models/Product";
import { authenticate, authorize, apiResponse } from "@/lib/auth";
import { UserRole } from "@/models/User";

// GET /api/v1/merchant/products - Get merchant's products
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    const authError = authorize(user!, [UserRole.MERCHANT]);
    if (authError) return authError;

    await connectDB();

    const products = await Product.find({ merchant_id: user!._id }).sort({
      created_at: -1,
    });

    return apiResponse.success(products);
  } catch (error) {
    console.error("Get merchant products error:", error);
    return apiResponse.serverError("Failed to get products");
  }
}

// POST /api/v1/merchant/products - Create product
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    const authError = authorize(user!, [UserRole.MERCHANT]);
    if (authError) return authError;

    await connectDB();

    const body = await request.json();
    const {
      name,
      category,
      price,
      description,
      images,
      stock_quantity,
      ai_tags,
      specifications,
    } = body;

    if (!name || !category || price === undefined) {
      return apiResponse.error("Name, category, and price are required");
    }

    const product = await Product.create({
      merchant_id: user!._id,
      name,
      category,
      price,
      description,
      images: images || [],
      stock_quantity: stock_quantity || 0,
      ai_tags: ai_tags || [],
      is_active: true,
      specifications: specifications || undefined,
    });

    return apiResponse.created(product, "Product created successfully");
  } catch (error) {
    console.error("Create product error:", error);
    return apiResponse.serverError("Failed to create product");
  }
}
