import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { Pet, SwipeInteraction, Match, SwipeAction } from "@/models";
import { authenticate, apiResponse } from "@/lib/auth";
import mongoose from "mongoose";

// POST /api/v1/pawmatch/swipe
export async function POST(request: NextRequest) {
    try {
        const { user, error } = await authenticate(request);
        if (error) return error;

        await connectDB();

        const body = await request.json();
        const { actorPetId, targetPetId, action } = body;

        if (!actorPetId || !targetPetId || !action) {
            return apiResponse.error("actorPetId, targetPetId, and action are required");
        }

        if (!Object.values(SwipeAction).includes(action)) {
            return apiResponse.error("Invalid action");
        }

        // Verify actorPet belongs to user
        const actorPet = await Pet.findOne({ _id: actorPetId, owner_id: user!._id });
        if (!actorPet) {
            return apiResponse.forbidden("Actor pet not found or does not belong to you");
        }

        // Check if interaction already exists to prevent duplicate swipes
        const existingInteraction = await SwipeInteraction.findOne({ actorPetId, targetPetId });
        if (existingInteraction) {
            return apiResponse.error("You have already swiped on this pet");
        }

        // Save interaction
        await SwipeInteraction.create({
            actorPetId,
            targetPetId,
            action,
        });

        let isMatch = false;

        // Check for match if action is LIKE
        if (action === SwipeAction.LIKE) {
            const mutualLike = await SwipeInteraction.findOne({
                actorPetId: targetPetId,
                targetPetId: actorPetId,
                action: SwipeAction.LIKE,
            });

            if (mutualLike) {
                isMatch = true;

                // Ensure consistent order for petA and petB to prevent duplicate match records
                const [petA, petB] = [actorPetId, targetPetId].sort();

                await Match.findOneAndUpdate(
                    { petA, petB },
                    { petA, petB },
                    { upsert: true, new: true }
                );
            }
        }

        return apiResponse.success({ isMatch }, isMatch ? "It's a Match!" : "Swipe recorded");
    } catch (error) {
        console.error("Swipe API error:", error);
        return apiResponse.serverError("Failed to record swipe");
    }
}
