import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Package from "@/models/Package";
import { authenticate, authorize, apiResponse } from "@/lib/auth";
import { UserRole } from "@/models/User";

// GET /api/v1/packages/:id - Get package by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    const roleError = authorize(user!, [UserRole.MANAGER, UserRole.ADMIN]);
    if (roleError) return roleError;

    await connectDB();
    const { id } = await params;

    const pkg = await Package.findById(id);
    if (!pkg) {
      return apiResponse.notFound("Package not found");
    }

    return apiResponse.success(pkg);
  } catch (error) {
    console.error("Get package error:", error);
    return apiResponse.serverError("Failed to fetch package");
  }
}

// PUT /api/v1/packages/:id - Update package
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    const roleError = authorize(user!, [UserRole.MANAGER, UserRole.ADMIN]);
    if (roleError) return roleError;

    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const pkg = await Package.findById(id);
    if (!pkg) {
      return apiResponse.notFound("Package not found");
    }

    // Allowed update fields
    const allowedUpdates = [
      "name",
      "target_role",
      "price",
      "duration_months",
      "description",
      "benefits",
      "features_config",
      "order",
      "is_active",
    ];

    allowedUpdates.forEach((field) => {
      if (body[field] !== undefined) {
        (pkg as any)[field] = body[field];
      }
    });

    await pkg.save();

    return apiResponse.success(pkg, "Package updated successfully");
  } catch (error) {
    console.error("Update package error:", error);
    return apiResponse.serverError("Failed to update package");
  }
}

// DELETE /api/v1/packages/:id - Deactivate package (Soft Delete as requested)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    const roleError = authorize(user!, [UserRole.MANAGER, UserRole.ADMIN]);
    if (roleError) return roleError;

    await connectDB();
    const { id } = await params;

    const pkg = await Package.findById(id);
    if (!pkg) {
      return apiResponse.notFound("Package not found");
    }

    pkg.is_active = false;
    await pkg.save();

    return apiResponse.success(null, "Package deactivated successfully");
  } catch (error) {
    console.error("Delete package error:", error);
    return apiResponse.serverError("Failed to deactivate package");
  }
}
