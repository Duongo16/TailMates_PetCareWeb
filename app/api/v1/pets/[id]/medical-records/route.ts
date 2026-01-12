import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Pet from "@/models/Pet";
import MedicalRecord from "@/models/MedicalRecord";
import { authenticate, apiResponse } from "@/lib/auth";
import mongoose from "mongoose";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/v1/pets/[id]/medical-records - Get pet's medical records
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

    // Owner or Merchant can view medical records
    if (
      pet.owner_id.toString() !== user!._id.toString() &&
      user!.role !== "MERCHANT" &&
      user!.role !== "MANAGER" &&
      user!.role !== "ADMIN"
    ) {
      return apiResponse.forbidden(
        "You don't have access to this pet's records"
      );
    }

    const records = await MedicalRecord.find({ pet_id: id })
      .populate("vet_id", "full_name merchant_profile.shop_name")
      .sort({ visit_date: -1 });

    return apiResponse.success(records);
  } catch (error) {
    console.error("Get medical records error:", error);
    return apiResponse.serverError("Failed to get medical records");
  }
}

// POST /api/v1/pets/[id]/medical-records - Create medical record
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // Owner can add their own records, Merchant can add professional records
    const isOwner = pet.owner_id.toString() === user!._id.toString();
    const isMerchant = user!.role === "MERCHANT";

    if (!isOwner && !isMerchant) {
      return apiResponse.forbidden("You cannot add records for this pet");
    }

    const body = await request.json();
    const { visit_date, diagnosis, treatment, notes, vaccines, attachments } =
      body;

    if (!visit_date || !diagnosis) {
      return apiResponse.error("Visit date and diagnosis are required");
    }

    const record = await MedicalRecord.create({
      pet_id: id,
      vet_id: isMerchant ? user!._id : undefined, // Only set vet_id if Merchant
      visit_date: new Date(visit_date),
      diagnosis,
      treatment,
      notes,
      vaccines: vaccines || [],
      attachments: attachments || [],
    });

    return apiResponse.created(record, "Medical record added successfully");
  } catch (error) {
    console.error("Create medical record error:", error);
    return apiResponse.serverError("Failed to create medical record");
  }
}
