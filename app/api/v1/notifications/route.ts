import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Notification from "@/models/Notification";
import { authenticate, apiResponse } from "@/lib/auth";

// GET /api/v1/notifications - Get notifications for authenticated user
export async function GET(request: NextRequest) {
    try {
        const { user, error } = await authenticate(request);
        if (error) return error;

        await connectDB();

        // Get query params
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "20");
        const page = parseInt(searchParams.get("page") || "1");
        const unreadOnly = searchParams.get("unread") === "true";

        const query: Record<string, unknown> = { user_id: user!._id };
        if (unreadOnly) {
            query.is_read = false;
        }

        const skip = (page - 1) * limit;

        const [notifications, total, unreadCount] = await Promise.all([
            Notification.find(query)
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Notification.countDocuments(query),
            Notification.countDocuments({ user_id: user!._id, is_read: false }),
        ]);

        return apiResponse.success({
            notifications,
            unreadCount,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Get notifications error:", error);
        return apiResponse.serverError("Failed to get notifications");
    }
}
