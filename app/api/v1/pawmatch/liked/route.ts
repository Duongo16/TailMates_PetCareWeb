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

        // Find all interactions where current pet liked others
        const interactions = await SwipeInteraction.find({
            actorPetId: petId,
            action: SwipeAction.LIKE
        }).populate({
            path: "targetPetId",
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
        const likedPets = interactions
            .filter(i => !matchedPetIds.includes(i.targetPetId._id.toString()))
            .map(i => i.targetPetId);

        return apiResponse.success(likedPets);
    } catch (error: any) {
        console.error("Liked API Error:", error);
        return apiResponse.serverError(error.message);
    }
}
