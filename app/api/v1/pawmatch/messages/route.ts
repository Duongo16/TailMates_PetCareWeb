import { NextRequest } from "next/server";
import { authenticate, apiResponse } from "@/lib/auth";
import connectDB from "@/lib/db";
import { Message, Match, Pet } from "@/models";
import { pusherServer } from "@/lib/pusher";

/**
 * GET /api/v1/pawmatch/messages?matchId=...
 * Fetch messages for a specific match
 */
export async function GET(request: NextRequest) {
    const { user, error } = await authenticate(request);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get("matchId");

    if (!matchId) {
        return apiResponse.badRequest("Missing matchId");
    }

    try {
        await connectDB();

        // Verify user owns one of the pets in the match
        const match = await Match.findById(matchId);
        if (!match) return apiResponse.notFound("Match not found");

        const userPetIds = await Pet.find({ owner: user!._id }).select("_id");
        const userPetIdStrings = userPetIds.map(p => p._id.toString());

        const isOwner = userPetIdStrings.includes(match.petA.toString()) || userPetIdStrings.includes(match.petB.toString());
        if (!isOwner) return apiResponse.forbidden("You don't have access to this chat");

        const messages = await Message.find({ matchId })
            .sort({ created_at: 1 })
            .limit(100);

        return apiResponse.success(messages);
    } catch (err: any) {
        return apiResponse.serverError(err.message);
    }
}

/**
 * POST /api/v1/pawmatch/messages
 * Send a new message
 */
export async function POST(request: NextRequest) {
    const { user, error } = await authenticate(request);
    if (error) return error;

    try {
        const body = await request.json();
        const { matchId, senderPetId, content } = body;

        if (!matchId || !senderPetId || !content) {
            return apiResponse.badRequest("Missing required fields");
        }

        await connectDB();

        // Verify ownership of senderPet
        const senderPet = await Pet.findOne({ _id: senderPetId, owner: user!._id });
        if (!senderPet) return apiResponse.forbidden("You don't own this pet");

        // Verify match exists and contains senderPet
        const match = await Match.findById(matchId);
        if (!match) return apiResponse.notFound("Match not found");

        const isPart = match.petA.toString() === senderPetId || match.petB.toString() === senderPetId;
        if (!isPart) {
            return apiResponse.forbidden("Pet is not part of this match");
        }

        const receiverPetId = match.petA.toString() === senderPetId ? match.petB : match.petA;

        const newMessage = await Message.create({
            matchId,
            senderPetId,
            receiverPetId,
            content,
        });

        // Trigger Pusher event
        await pusherServer.trigger(`chat-${matchId}`, "new-message", newMessage);

        // Also trigger notification for receiver owner
        const receiverPet: any = await Pet.findById(receiverPetId).populate("owner");
        if (receiverPet && receiverPet.owner) {
            // Here you could send a system notification
        }

        return apiResponse.success(newMessage, "Message sent successfully", 201);
    } catch (err: any) {
        return apiResponse.serverError(err.message);
    }
}
