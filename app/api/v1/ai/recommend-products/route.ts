import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Pet from "@/models/Pet";
import Product from "@/models/Product";
import { authenticate, authorize, apiResponse } from "@/lib/auth";
import { UserRole } from "@/models/User";
import { checkFeatureAccess } from "@/lib/subscription-guard";
import mongoose from "mongoose";

// POST /api/v1/ai/recommend-products - AI product recommendations
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
    const { pet_id } = body;

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

    // Build AI matching tags based on pet characteristics
    const matchTags: string[] = [];

    // Species-based tags
    if (pet.species.toLowerCase().includes("cat") || pet.species.toLowerCase().includes("mèo")) {
      matchTags.push("cat", "feline");
    }
    if (pet.species.toLowerCase().includes("dog") || pet.species.toLowerCase().includes("chó")) {
      matchTags.push("dog", "canine");
    }

    // Age-based tags
    if (pet.age_months < 12) {
      matchTags.push("kitten", "puppy", "young", "junior");
    } else if (pet.age_months > 84) {
      matchTags.push("senior", "adult");
    } else {
      matchTags.push("adult");
    }

    // Weight-based tags
    if (pet.weight_kg && pet.weight_kg > 10) {
      matchTags.push("large");
    } else {
      matchTags.push("small", "indoor");
    }

    // Sterilization
    if (pet.sterilized) {
      matchTags.push("sterilized", "indoor", "weight-control");
    }

    // Find products matching tags
    const products = await Product.find({
      is_active: true,
      $or: [
        { ai_tags: { $in: matchTags } },
        { category: "FOOD" }, // Always include food
      ],
    })
      .populate("merchant_id", "full_name merchant_profile.shop_name")
      .limit(12)
      .sort({ ai_tags: -1 });

    // Mark AI-matched products
    const recommendedProducts = products.map((p) => {
      const matchedTags = p.ai_tags.filter((tag: string) =>
        matchTags.includes(tag.toLowerCase())
      );
      return {
        ...p.toObject(),
        ai_match: matchedTags.length > 0,
        match_score: matchedTags.length,
        match_reasons: matchedTags,
      };
    });

    // Sort by match score
    recommendedProducts.sort((a, b) => b.match_score - a.match_score);

    return apiResponse.success({
      pet_name: pet.name,
      pet_species: pet.species,
      recommendations: recommendedProducts,
      matched_tags: matchTags,
    });
  } catch (error) {
    console.error("Recommend products error:", error);
    return apiResponse.serverError("Failed to get product recommendations");
  }
}
