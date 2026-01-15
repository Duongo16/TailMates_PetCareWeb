import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Pet from "@/models/Pet";
import { authenticate, apiResponse } from "@/lib/auth";
import mongoose from "mongoose";
import { deleteFromCloudinary } from "@/lib/cloudinary";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/v1/pets/[id] - Get pet by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiResponse.error("Invalid pet ID");
    }

    const pet = await Pet.findById(id);

    if (!pet) {
      return apiResponse.notFound("Pet not found");
    }

    // Check ownership (owner or merchant can view for services)
    if (
      pet.owner_id.toString() !== user!._id.toString() &&
      user!.role !== "MERCHANT" &&
      user!.role !== "MANAGER" &&
      user!.role !== "ADMIN"
    ) {
      return apiResponse.forbidden("You don't have access to this pet");
    }

    return apiResponse.success(pet);
  } catch (error) {
    console.error("Get pet error:", error);
    return apiResponse.serverError("Failed to get pet");
  }
}

// PUT /api/v1/pets/[id] - Update pet
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiResponse.error("Invalid pet ID");
    }

    const pet = await Pet.findById(id);

    if (!pet) {
      return apiResponse.notFound("Pet not found");
    }

    // Only owner can update
    if (pet.owner_id.toString() !== user!._id.toString()) {
      return apiResponse.forbidden("You can only update your own pets");
    }

    const body = await request.json();
    const updateFields = [
      "name",
      "species",
      "breed",
      "age_months",
      "weight_kg",
      "gender",
      "sterilized",
      "image",
      "ai_analysis",
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of updateFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Delete old image from Cloudinary if image is being updated
    if (body.image && pet.image?.public_id && body.image.public_id !== pet.image.public_id) {
      await deleteFromCloudinary(pet.image.public_id);
    }

    const updatedPet = await Pet.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    return apiResponse.success(updatedPet, "Pet updated successfully");
  } catch (error) {
    console.error("Update pet error:", error);
    return apiResponse.serverError("Failed to update pet");
  }
}

// DELETE /api/v1/pets/[id] - Delete pet
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiResponse.error("Invalid pet ID");
    }

    const pet = await Pet.findById(id);

    if (!pet) {
      return apiResponse.notFound("Pet not found");
    }

    // Only owner can delete
    if (pet.owner_id.toString() !== user!._id.toString()) {
      return apiResponse.forbidden("You can only delete your own pets");
    }

    // Delete pet image from Cloudinary
    if (pet.image?.public_id) {
      await deleteFromCloudinary(pet.image.public_id);
    }

    await Pet.findByIdAndDelete(id);

    return apiResponse.success(null, "Pet deleted successfully");
  } catch (error) {
    console.error("Delete pet error:", error);
    return apiResponse.serverError("Failed to delete pet");
  }
}
