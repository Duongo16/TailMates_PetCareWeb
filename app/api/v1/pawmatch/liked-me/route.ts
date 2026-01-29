import { NextRequest, NextResponse } from "next/server";
import { authenticate, apiResponse } from "@/lib/auth";
import SwipeInteraction, { SwipeAction } from "@/models/SwipeInteraction";
import Match from "@/models/Match";
import Pet from "@/models/Pet";
import connectDB from "@/lib/db";

export async function GET(req: NextRequest) {
    try {
        const { user, error } = await authenticate(req);
        if (error) return error;

        await connectDB();
        
        const searchParams = req.nextUrl.searchParams;
        const petId = searchParams.get("petId");
        if (!petId) return apiResponse.badRequest("Pet ID required");

        // Verify pet ownership
        const pet = await Pet.findById(petId);
        if (!pet || pet.owner_id.toString() !== user?._id.toString()) {
            return apiResponse.forbidden("Unauthorized access to this pet");
        }

        // Find all interactions where others LIKED this pet
        const likes = await SwipeInteraction.find({
            targetPetId: petId,
            action: SwipeAction.LIKE
        }).populate({
            path: "actorPetId",
            populate: {
                path: "owner_id",
                select: "full_name name avatar address created_at"
            }
        });

        // Find existing matches to filter them out
        const matches = await Match.find({
            $or: [{ petA: petId }, { petB: petId }]
        });
        const matchedPetIds = matches.map(m => 
            m.petA.toString() === petId ? m.petB.toString() : m.petA.toString()
        );

        // Filter and clean for frontend
        const likers = likes
            .filter(like => !matchedPetIds.includes(like.actorPetId._id.toString()))
            .map(like => like.actorPetId);

        return apiResponse.success(likers);
    } catch (error: any) {
        console.error("LikedMe API Error:", error);
        return apiResponse.serverError(error.message);
    }
}
