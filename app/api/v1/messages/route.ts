import { NextRequest } from "next/server";
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
            .populate("senderId", "name image")
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

        // Update conversation's lastMessage and bump updated_at
        await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: newMessage._id,
            updated_at: new Date(),
            // Reset unread counts for others? Or increment?
            // Logic: For each participant except sender, increment unreadCount
        });

        // Increment unread counts for other participants
        const updateUnread: any = {};
        conversation.participants.forEach((pId: mongoose.Types.ObjectId) => {
            if (pId.toString() !== user!._id.toString()) {
                updateUnread[`unreadCount.${pId}`] = 1;
            }
        });

        if (Object.keys(updateUnread).length > 0) {
            await Conversation.findByIdAndUpdate(conversationId, { $inc: updateUnread });
        }

        const populatedMessage = await Message.findById(newMessage._id).populate("senderId", "name image");

        // Trigger Pusher event
        await pusherServer.trigger(`conversation-${conversationId}`, "new-message", populatedMessage);

        // Also trigger global event for sidebar notification update
        conversation.participants.forEach((pId: mongoose.Types.ObjectId) => {
            pusherServer.trigger(`user-${pId}-chats`, "conversation-update", {
                conversationId,
                lastMessage: populatedMessage,
            });
        });

        return apiResponse.success(populatedMessage, "Message sent successfully", 201);
    } catch (error) {
        console.error("Send message error:", error);
        return apiResponse.serverError("Failed to send message");
    }
}
