import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Pet from "@/models/Pet";
import { authenticate, authorize, apiResponse } from "@/lib/auth";
import { UserRole } from "@/models/User";

// GET /api/v1/pets - List user's pets
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    await connectDB();

    const pets = await Pet.find({ owner_id: user!._id }).sort({
      created_at: -1,
    });

    return apiResponse.success(pets);
  } catch (error) {
    console.error("Get pets error:", error);
    return apiResponse.serverError("Failed to get pets");
  }
}

// POST /api/v1/pets - Create new pet
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    // Only customers can add pets
    const authError = authorize(user!, [UserRole.CUSTOMER]);
    if (authError) return authError;

    await connectDB();

    const body = await request.json();
    const {
      name,
      species,
      breed,
      age_months,
      weight_kg,
      gender,
      sterilized,
      image,
      color,
      fur_type,
      microchip,
      allergies,
      notes,
      mediaGallery,
      datingProfile,
    } = body;

    // Validation
    if (!name || !species || age_months === undefined || !gender) {
      return apiResponse.error(
        "Name, species, age_months, and gender are required"
      );
    }

    // Validate and prepare image data
    let validatedImage = undefined;
    if (image) {
      if (typeof image === 'object' && image.url && image.public_id) {
        validatedImage = {
          url: image.url,
          public_id: image.public_id
        };
      } else {
        console.error('Invalid image format during pet creation:', image);
      }
    }

    // Create pet
    const pet = await Pet.create({
      owner_id: user!._id,
      name,
      species,
      breed,
      age_months,
      weight_kg,
      gender,
      sterilized: sterilized || false,
      color,
      fur_type,
      microchip,
      allergies,
      notes,
      image: validatedImage,
      mediaGallery,
      datingProfile,
    });

    return apiResponse.created(pet, "Pet added successfully");
  } catch (error) {
    console.error("Create pet error:", error);
    return apiResponse.serverError("Failed to create pet");
  }
}
