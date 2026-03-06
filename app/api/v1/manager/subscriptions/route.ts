import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import SubscriptionLog from "@/models/SubscriptionLog";
import User from "@/models/User";
import Package from "@/models/Package";
import { authenticate, authorize, apiResponse } from "@/lib/auth";
import { UserRole } from "@/models/User";

// GET /api/v1/manager/subscriptions - List package subscriptions (Manager only)
export async function GET(request: NextRequest) {
    try {
        const { user, error } = await authenticate(request);
        if (error) return error;

        const authError = authorize(user!, [UserRole.MANAGER, UserRole.ADMIN]);
        if (authError) return authError;

        await connectDB();

        // Get query params for pagination/filtering (optional)
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "50");
        const page = parseInt(searchParams.get("page") || "1");
        const skip = (page - 1) * limit;

        const subscriptions = await SubscriptionLog.find()
            .populate("user_id", "full_name email role")
            .populate("package_id", "name")
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await SubscriptionLog.countDocuments();

        return apiResponse.success({
            subscriptions,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("List subscriptions error:", error);
        return apiResponse.serverError("Failed to list subscriptions");
    }
}
