import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { Pet, SwipeInteraction } from "@/models";
import { authenticate, apiResponse } from "@/lib/auth";
import { checkFeatureAccess } from "@/lib/subscription-guard";
import mongoose from "mongoose";

// GET /api/v1/pawmatch/discovery?petId=...&species=...
export async function GET(request: NextRequest) {
    try {
        const { user, error } = await authenticate(request);
        if (error) return error;

        // Check pawmate_connect feature from subscription
        const featureCheck = await checkFeatureAccess(user!, "pawmate_connect");
        if (!featureCheck.allowed) {
            return apiResponse.forbidden(featureCheck.reason);
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const petId = searchParams.get("petId");
        const species = searchParams.get("species");

        if (!petId || !mongoose.Types.ObjectId.isValid(petId)) {
            return apiResponse.error("Valid petId is required");
        }

        // Verify pet belongs to user
        const currentPet = await Pet.findOne({ _id: petId, owner_id: user!._id });
        if (!currentPet) {
            return apiResponse.forbidden("Pet not found or does not belong to you");
        }

        // Get IDs of pets already swiped by this pet
        const swipedInteractions = await SwipeInteraction.find({ actorPetId: petId }).select("targetPetId");
        const swipedPetIds = swipedInteractions.map((s) => s.targetPetId);

        // Filter logic:
        // 1. Not the current pet
        // 2. Not owned by the current user
        // 3. Not already swiped
        // 4. Same species (default behavior for discovery)
        const query: any = {
            _id: { $nin: [...swipedPetIds, new mongoose.Types.ObjectId(petId)] },
            owner_id: { $ne: user!._id },
        };

        if (species) {
            query.species = species;
        } else {
            // Default: show same species first
            query.species = currentPet.species;
        }

        const discoveryPets = await Pet.find(query)
            .limit(20)
            .select("name species breed age_months gender image mediaGallery datingProfile owner_id");

        return apiResponse.success(discoveryPets);
    } catch (error) {
        console.error("Discovery API error:", error);
        return apiResponse.serverError("Failed to fetch discovery pets");
    }
}
