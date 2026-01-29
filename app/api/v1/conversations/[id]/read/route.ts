import { NextRequest } from "next/server";
export const dynamic = "force-dynamic";
import connectDB from "@/lib/db";
import { Conversation } from "@/models";
import { authenticate, apiResponse } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher";

// POST /api/v1/conversations/[id]/read - Mark conversation as read
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { user, error } = await authenticate(request);
        if (error) return error;

        const { id: conversationId } = await params;
        if (!conversationId) {
            return apiResponse.badRequest("Missing conversationId");
        }

        await connectDB();

        // Update the Map field: set unreadCount[userId] = 0
        const updateField = `unreadCount.${user!._id.toString()}`;

        const conversation = await Conversation.findOneAndUpdate(
            { _id: conversationId, participants: user!._id },
            { $set: { [updateField]: 0 } },
            { new: true }
        ).lean();

        if (!conversation) {
            return apiResponse.notFound("Conversation not found or access denied");
        }

        // Trigger Pusher event to update sidebar in real-time
        if (pusherServer) {
            await pusherServer.trigger(`user-${user!._id.toString()}-chats`, "conversation-update", {
                conversationId,
                unreadCount: 0
            });
        }

        return apiResponse.success({ conversationId, unreadCount: 0 }, "Marked as read");
    } catch (error) {
        console.error("Mark as read error:", error);
        return apiResponse.serverError("Failed to mark as read");
    }
}
