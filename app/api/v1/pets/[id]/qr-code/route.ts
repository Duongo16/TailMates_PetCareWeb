import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Pet from "@/models/Pet";
import { authenticate, apiResponse } from "@/lib/auth";
import mongoose from "mongoose";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/v1/pets/[id]/qr-code - Generate QR code data for pet
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

    // Only owner can generate QR code
    if (pet.owner_id.toString() !== user!._id.toString()) {
      return apiResponse.forbidden("You can only generate QR for your own pets");
    }

    // Generate QR code data (URL to access pet's medical records)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const qrData = {
      pet_id: pet._id,
      pet_name: pet.name,
      species: pet.species,
      breed: pet.breed,
      // URL that merchants can access to view medical records
      medical_records_url: `${baseUrl}/api/v1/pets/${pet._id}/medical-records`,
      // Public profile URL (for scanning)
      profile_url: `${baseUrl}/pet/${pet._id}`,
      generated_at: new Date().toISOString(),
    };

    return apiResponse.success(qrData, "QR code data generated");
  } catch (error) {
    console.error("Generate QR error:", error);
    return apiResponse.serverError("Failed to generate QR code");
  }
}
