import { NextRequest } from "next/server";
export const dynamic = "force-dynamic";
import { authenticate, apiResponse } from "@/lib/auth";
import connectDB from "@/lib/db";
import { Message, Conversation } from "@/models";
import { pusherServer } from "@/lib/pusher";
import mongoose from "mongoose";

// GET /api/v1/messages?conversationId=... - Fetch messages for a conversation
export async function GET(request: NextRequest) {
    try {
        const { user, error } = await authenticate(request);
        if (error) return error;

        const { searchParams } = new URL(request.url);
        const conversationId = searchParams.get("conversationId");

        if (!conversationId) {
            return apiResponse.badRequest("Missing conversationId");
        }

        await connectDB();

        // Verify user is a participant
        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: user!._id,
        });

        if (!conversation) {
            return apiResponse.forbidden("You don't have access to this conversation");
        }

        const messages = await Message.find({ conversationId })
            .populate("senderId", "full_name avatar")
            .sort({ created_at: 1 })
            .limit(100);

        return apiResponse.success(messages);
    } catch (error) {
        console.error("Get messages error:", error);
        return apiResponse.serverError("Failed to get messages");
    }
}

// POST /api/v1/messages - Send a new message
export async function POST(request: NextRequest) {
    try {
        const { user, error } = await authenticate(request);
        if (error) return error;

        await connectDB();

        const body = await request.json();
        const { conversationId, content, media } = body;

        if (!conversationId || (!content && !media)) {
            return apiResponse.badRequest("Missing required fields");
        }

        // Verify user is a participant
        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: user!._id,
        });

        if (!conversation) {
            return apiResponse.forbidden("You don't have access to this conversation");
        }

        const newMessage = await Message.create({
            conversationId,
            senderId: user!._id,
            content,
            media,
        });

        // Update conversation's lastMessage, updated_at and increment unread counts for other participants
        const incrementData: any = {};
        conversation.participants.forEach((pId: mongoose.Types.ObjectId) => {
            if (pId.toString() !== user!._id.toString()) {
                incrementData[`unreadCount.${pId.toString()}`] = 1;
            }
        });

        const updatedConversation = await Conversation.findByIdAndUpdate(
            conversationId,
            {
                $set: {
                    lastMessage: newMessage._id,
                    updated_at: new Date(),
                },
                $inc: incrementData
            },
            { new: true }
        ).lean();

        const populatedMessage = await Message.findById(newMessage._id).populate("senderId", "full_name avatar");

        // Trigger Pusher event
        if (pusherServer) {
            await pusherServer.trigger(`conversation-${conversationId}`, "new-message", populatedMessage);

            // Also trigger global event for sidebar notification update
            conversation.participants.forEach((pId: mongoose.Types.ObjectId) => {
                const pIdStr = pId.toString();
                pusherServer.trigger(`user-${pIdStr}-chats`, "conversation-update", {
                    conversationId,
                    lastMessage: populatedMessage,
                    unreadCount: updatedConversation?.unreadCount?.get(pIdStr) || 0
                });
            });
        }

        return apiResponse.success(populatedMessage, "Message sent successfully", 201);
    } catch (error) {
        console.error("Send message error:", error);
        return apiResponse.serverError("Failed to send message");
    }
}
