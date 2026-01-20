import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Notification from "@/models/Notification";
import { authenticate, apiResponse } from "@/lib/auth";

// POST /api/v1/notifications/read-all - Mark all notifications as read
export async function POST(request: NextRequest) {
    try {
        const { user, error } = await authenticate(request);
        if (error) return error;

        await connectDB();

        const result = await Notification.updateMany(
            { user_id: user!._id, is_read: false },
            { $set: { is_read: true } }
        );

        return apiResponse.success(
            { modifiedCount: result.modifiedCount },
            "All notifications marked as read"
        );
    } catch (error) {
        console.error("Mark all notifications as read error:", error);
        return apiResponse.serverError("Failed to update notifications");
    }
}
