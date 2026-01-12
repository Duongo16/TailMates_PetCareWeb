import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Product from "@/models/Product";
import { authenticate, authorize, apiResponse } from "@/lib/auth";
import { UserRole } from "@/models/User";
import mongoose from "mongoose";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/v1/merchant/products/[id] - Get product by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    const authError = authorize(user!, [UserRole.MERCHANT]);
    if (authError) return authError;

    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiResponse.error("Invalid product ID");
    }

    const product = await Product.findOne({
      _id: id,
      merchant_id: user!._id,
    });

    if (!product) {
      return apiResponse.notFound("Product not found");
    }

    return apiResponse.success(product);
  } catch (error) {
    console.error("Get product error:", error);
    return apiResponse.serverError("Failed to get product");
  }
}

// PUT /api/v1/merchant/products/[id] - Update product
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    const authError = authorize(user!, [UserRole.MERCHANT]);
    if (authError) return authError;

    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiResponse.error("Invalid product ID");
    }

    const product = await Product.findOne({
      _id: id,
      merchant_id: user!._id,
    });

    if (!product) {
      return apiResponse.notFound("Product not found");
    }

    const body = await request.json();
    const updateFields = [
      "name",
      "category",
      "price",
      "description",
      "images",
      "stock_quantity",
      "ai_tags",
      "is_active",
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of updateFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    return apiResponse.success(updatedProduct, "Product updated successfully");
  } catch (error) {
    console.error("Update product error:", error);
    return apiResponse.serverError("Failed to update product");
  }
}

// DELETE /api/v1/merchant/products/[id] - Delete product
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    const authError = authorize(user!, [UserRole.MERCHANT]);
    if (authError) return authError;

    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiResponse.error("Invalid product ID");
    }

    const product = await Product.findOne({
      _id: id,
      merchant_id: user!._id,
    });

    if (!product) {
      return apiResponse.notFound("Product not found");
    }

    await Product.findByIdAndDelete(id);

    return apiResponse.success(null, "Product deleted successfully");
  } catch (error) {
    console.error("Delete product error:", error);
    return apiResponse.serverError("Failed to delete product");
  }
}
