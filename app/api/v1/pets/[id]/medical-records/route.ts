import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Pet from "@/models/Pet";
import MedicalRecord, { ConfirmationStatus, RecordType } from "@/models/MedicalRecord";
import Booking from "@/models/Booking";
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
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // Filter by confirmation status

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiResponse.error("Invalid pet ID");
    }

    const pet = await Pet.findById(id);

    if (!pet) {
      return apiResponse.notFound("Pet not found");
    }

    const isOwner = pet.owner_id.toString() === user!._id.toString();
    const isMerchant = user!.role === "MERCHANT";
    const isManager = user!.role === "MANAGER";
    const isAdmin = user!.role === "ADMIN";

    if (!isOwner && !isMerchant && !isManager && !isAdmin) {
      return apiResponse.forbidden(
        "You don't have access to this pet's records"
      );
    }

    // Build query
    const query: Record<string, unknown> = { pet_id: id };

    // Customers and Merchants see all records by default unless filtered
    if (status) {
      query.confirmation_status = status;
    }

    // Merchants only see records they created
    if (isMerchant) {
      query.vet_id = user!._id;
    }

    const records = await MedicalRecord.find(query)
      .populate("vet_id", "full_name merchant_profile.shop_name merchant_profile.address")
      .populate("booking_id", "booking_time service_id")
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
    const {
      booking_id,
      record_type,
      visit_date,
      diagnosis,
      treatment,
      condition,
      notes,
      vaccines,
      medications,
      follow_up_date,
      follow_up_notes,
      attachments,
    } = body;

    // Validation
    if (!visit_date || !diagnosis || !record_type) {
      return apiResponse.error("Visit date, diagnosis, and record type are required");
    }

    // Validate record_type
    if (!Object.values(RecordType).includes(record_type)) {
      return apiResponse.error("Invalid record type");
    }

    // If booking_id provided, verify it exists and belongs to this merchant
    if (booking_id) {
      if (!mongoose.Types.ObjectId.isValid(booking_id)) {
        return apiResponse.error("Invalid booking ID");
      }
      const booking = await Booking.findById(booking_id);
      if (!booking) {
        return apiResponse.notFound("Booking not found");
      }
      if (isMerchant && booking.merchant_id.toString() !== user!._id.toString()) {
        return apiResponse.forbidden("You cannot add records for this booking");
      }
      if (booking.pet_id.toString() !== id) {
        return apiResponse.error("Booking does not match this pet");
      }
    }

    // Determine confirmation status
    // If owner creates record -> auto CONFIRMED
    // If merchant creates record -> PENDING (needs customer confirmation)
    const confirmationStatus = isOwner
      ? ConfirmationStatus.CONFIRMED
      : ConfirmationStatus.PENDING;

    const record = await MedicalRecord.create({
      pet_id: id,
      vet_id: isMerchant ? user!._id : undefined,
      booking_id: booking_id || undefined,
      record_type,
      confirmation_status: confirmationStatus,
      visit_date: new Date(visit_date),
      diagnosis,
      treatment,
      condition,
      notes,
      vaccines: vaccines || [],
      medications: medications || [],
      follow_up_date: follow_up_date ? new Date(follow_up_date) : undefined,
      follow_up_notes,
      attachments: attachments || [],
    });

    const populatedRecord = await MedicalRecord.findById(record._id)
      .populate("vet_id", "full_name merchant_profile.shop_name");

    return apiResponse.created(
      populatedRecord,
      isMerchant
        ? "Medical record created. Waiting for customer confirmation."
        : "Medical record added successfully"
    );
  } catch (error) {
    console.error("Create medical record error:", error);
    return apiResponse.serverError("Failed to create medical record");
  }
}
