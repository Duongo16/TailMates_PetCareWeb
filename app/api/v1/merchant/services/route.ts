import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Service from "@/models/Service";
import { authenticate, authorize, apiResponse } from "@/lib/auth";
import { UserRole } from "@/models/User";

// GET /api/v1/merchant/services - Get merchant's services
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    const authError = authorize(user!, [UserRole.MERCHANT]);
    if (authError) return authError;

    await connectDB();

    const services = await Service.find({ merchant_id: user!._id }).sort({
      created_at: -1,
    });

    return apiResponse.success(services);
  } catch (error) {
    console.error("Get merchant services error:", error);
    return apiResponse.serverError("Failed to get services");
  }
}

// POST /api/v1/merchant/services - Create service
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
      price_min,
      price_max,
      duration_minutes,
      description,
      image,
    } = body;

    if (!name || price_min === undefined || price_max === undefined || !duration_minutes) {
      return apiResponse.error(
        "Name, price_min, price_max, and duration_minutes are required"
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
        console.error('Invalid image format during service creation:', image);
      }
    }

    const service = await Service.create({
      merchant_id: user!._id,
      name,
      price_min,
      price_max,
      duration_minutes,
      description,
      image: validatedImage,
      is_active: true,
    });

    return apiResponse.created(service, "Service created successfully");
  } catch (error) {
    console.error("Create service error:", error);
    return apiResponse.serverError("Failed to create service");
  }
}
