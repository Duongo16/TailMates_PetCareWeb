import { NextRequest } from "next/server";
import { authenticate, apiResponse } from "@/lib/auth";
import connectDB from "@/lib/db";
import { Match, Pet } from "@/models";

/**
 * GET /api/v1/pawmatch/matches?petId=...
 * Fetch all matches for a specific pet
 */
export async function GET(request: NextRequest) {
    const { user, error } = await authenticate(request);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const petId = searchParams.get("petId");

    if (!petId) {
        return apiResponse.badRequest("Missing petId");
    }

    try {
        await connectDB();

        // Verify user owns the pet
        const pet = await Pet.findOne({ _id: petId, owner: user!._id });
        if (!pet) return apiResponse.forbidden("You don't own this pet");

        // Find all matches involving this pet
        // In our model, petA and petB are stored. We need to check both.
        const matches = await Match.find({
            $or: [{ petA: petId }, { petB: petId }]
        }).populate("petA petB");

        // Map matches to a cleaner format for frontend
        const formattedMatches = matches.map((match: any) => {
            const pets = [match.petA, match.petB];
            return {
                _id: match._id,
                pets,
                created_at: match.created_at
            };
        });

        return apiResponse.success(formattedMatches);
    } catch (err: any) {
        return apiResponse.serverError(err.message);
    }
}
