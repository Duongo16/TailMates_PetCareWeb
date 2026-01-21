import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import BlogPost, { BlogStatus } from "@/models/BlogPost";
import User from "@/models/User";
import { apiResponse, verifyToken } from "@/lib/auth";

// GET /api/v1/manager/blog - List blog posts for manager
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const token = request.headers.get("authorization")?.replace("Bearer ", "");
        if (!token) {
            return apiResponse.unauthorized("Authentication required");
        }

        const decoded = await verifyToken(token);
        if (!decoded) {
            return apiResponse.unauthorized("Invalid token");
        }

        // Verify user is MANAGER
        const user = await User.findById(decoded.userId);
        if (!user || user.role !== "MANAGER") {
            return apiResponse.forbidden("Only managers can access this endpoint");
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status") || BlogStatus.PENDING;
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");

        const query: Record<string, unknown> = {};

        if (status && status !== "ALL") {
            query.status = status;
        }

        const total = await BlogPost.countDocuments(query);
        const posts = await BlogPost.find(query)
            .populate("author_id", "full_name email avatar merchant_profile")
            .sort({ created_at: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        return apiResponse.success({
            posts,
            pagination: {
                total,
                page,
                limit,
                total_pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Get manager blog posts error:", error);
        return apiResponse.serverError("Failed to get blog posts");
    }
}
