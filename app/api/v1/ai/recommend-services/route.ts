import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Pet from "@/models/Pet";
import Service from "@/models/Service";
import { authenticate, authorize, apiResponse } from "@/lib/auth";
import { UserRole } from "@/models/User";
import { checkFeatureAccess } from "@/lib/subscription-guard";
import mongoose from "mongoose";

// POST /api/v1/ai/recommend-services - AI service recommendations
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    const authError = authorize(user!, [UserRole.CUSTOMER]);
    if (authError) return authError;

    // Check ai_recommendations feature from subscription
    const featureCheck = await checkFeatureAccess(user!, "ai_recommendations");
    if (!featureCheck.allowed) {
      return apiResponse.forbidden(featureCheck.reason);
    }

    await connectDB();

    const body = await request.json();
    const { pet_id, need_type } = body;

    if (!pet_id || !mongoose.Types.ObjectId.isValid(pet_id)) {
      return apiResponse.error("Valid pet ID is required");
    }

    const pet = await Pet.findById(pet_id);
    if (!pet) {
      return apiResponse.notFound("Pet not found");
    }

    if (pet.owner_id.toString() !== user!._id.toString()) {
      return apiResponse.forbidden("You can only get recommendations for your own pets");
    }

    // Get all active services
    const services = await Service.find({ is_active: true })
      .populate("merchant_id", "full_name merchant_profile.shop_name merchant_profile.rating merchant_profile.address")
      .sort({ "merchant_id.merchant_profile.rating": -1 });

    // Build recommendations based on pet needs
    const recommendations: any[] = [];

    for (const service of services) {
      let matchScore = 0;
      const matchReasons: string[] = [];

      // Service name matching
      const serviceName = service.name.toLowerCase();
      const petSpecies = pet.species.toLowerCase();

      // Spa services for all pets
      if (serviceName.includes("spa") || serviceName.includes("tắm")) {
        matchScore += 2;
        matchReasons.push("Dịch vụ spa phù hợp cho " + pet.species);
      }

      // Grooming for dogs/cats
      if (
        serviceName.includes("cắt") ||
        serviceName.includes("tỉa") ||
        serviceName.includes("grooming")
      ) {
        if (petSpecies.includes("dog") || petSpecies.includes("chó") ||
            petSpecies.includes("cat") || petSpecies.includes("mèo")) {
          matchScore += 2;
          matchReasons.push("Phù hợp với lông " + pet.breed);
        }
      }

      // Health check for older pets
      if (
        serviceName.includes("khám") ||
        serviceName.includes("checkup") ||
        serviceName.includes("sức khỏe")
      ) {
        if (pet.age_months > 36) {
          matchScore += 3;
          matchReasons.push("Khuyến nghị khám định kỳ cho " + pet.name);
        } else {
          matchScore += 1;
        }
      }

      // Vaccination for young pets
      if (serviceName.includes("vaccine") || serviceName.includes("tiêm")) {
        if (pet.age_months < 24) {
          matchScore += 3;
          matchReasons.push("Thú cưng còn nhỏ cần tiêm phòng đầy đủ");
        } else {
          matchScore += 1;
          matchReasons.push("Nhắc tiêm vaccine định kỳ");
        }
      }

      // Need type filter
      if (need_type) {
        if (need_type === "health" && !serviceName.includes("khám") && !serviceName.includes("vaccine")) {
          continue;
        }
        if (need_type === "grooming" && !serviceName.includes("spa") && !serviceName.includes("cắt")) {
          continue;
        }
      }

      recommendations.push({
        ...service.toObject(),
        ai_match: matchScore > 0,
        match_score: matchScore,
        match_reasons: matchReasons,
      });
    }

    // Sort by match score
    recommendations.sort((a, b) => b.match_score - a.match_score);

    return apiResponse.success({
      pet_name: pet.name,
      pet_species: pet.species,
      recommendations: recommendations.slice(0, 10),
    });
  } catch (error) {
    console.error("Recommend services error:", error);
    return apiResponse.serverError("Failed to get service recommendations");
  }
}
