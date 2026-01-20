import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Notification from "@/models/Notification";
import { authenticate, apiResponse } from "@/lib/auth";
import mongoose from "mongoose";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// PATCH /api/v1/notifications/[id] - Mark notification as read
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { user, error } = await authenticate(request);
        if (error) return error;

        await connectDB();

        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return apiResponse.error("Invalid notification ID");
        }

        const notification = await Notification.findOne({
            _id: id,
            user_id: user!._id,
        });

        if (!notification) {
            return apiResponse.notFound("Notification not found");
        }

        notification.is_read = true;
        await notification.save();

        return apiResponse.success(notification, "Notification marked as read");
    } catch (error) {
        console.error("Mark notification as read error:", error);
        return apiResponse.serverError("Failed to update notification");
    }
}
