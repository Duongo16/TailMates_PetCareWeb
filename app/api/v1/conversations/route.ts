import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { Conversation, ConversationType } from "@/models";
import { authenticate, apiResponse } from "@/lib/auth";
import mongoose from "mongoose";

// GET /api/v1/conversations - Get all conversations for the user
export async function GET(request: NextRequest) {
    try {
        const { user, error } = await authenticate(request);
        if (error) return error;

        await connectDB();

        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type");

        let query: any = { participants: user!._id };
        if (type && Object.values(ConversationType).includes(type as ConversationType)) {
            query.type = type;
        }

        const conversations = await Conversation.find(query)
            .populate("participants", "name email image")
            .populate("lastMessage")
            .sort({ updated_at: -1 });

        return apiResponse.success(conversations);
    } catch (error) {
        console.error("Get conversations error:", error);
        return apiResponse.serverError("Failed to get conversations");
    }
}

// POST /api/v1/conversations - Create or find a conversation
export async function POST(request: NextRequest) {
    try {
        const { user, error } = await authenticate(request);
        if (error) return error;

        await connectDB();

        const body = await request.json();
        const { type, participantIds, contextId, metadata } = body;

        if (!type || !participantIds || !Array.isArray(participantIds)) {
            return apiResponse.error("Missing required fields");
        }

        // Ensure current user is in participants
        const allParticipants = Array.from(new Set([...participantIds, user!._id.toString()]));

        // Check if a conversation with same participants and type (and context if provided) already exists
        let query: any = {
            type,
            participants: { $all: allParticipants, $size: allParticipants.length },
        };

        if (contextId) {
            query.contextId = contextId;
        }

        let conversation = await Conversation.findOne(query);

        if (!conversation) {
            conversation = await Conversation.create({
                type,
                participants: allParticipants,
                contextId,
                metadata,
                unreadCount: new Map(allParticipants.map(id => [id.toString(), 0]))
            });

            await conversation.populate("participants", "name email image");
        }

        return apiResponse.success(conversation);
    } catch (error) {
        console.error("Create conversation error:", error);
        return apiResponse.serverError("Failed to create conversation");
    }
}
