import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import BlogPost from "@/models/BlogPost";
import { authenticate, apiResponse } from "@/lib/auth";

// GET /api/v1/blog/my-posts - Get current user's blog posts
export async function GET(request: NextRequest) {
    try {
        const { user, error } = await authenticate(request);
        if (error) return error;

        await connectDB();

        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const status = searchParams.get("status");

        const query: any = {
            author_id: user!._id,
        };

        if (status && status !== "ALL") {
            query.status = status;
        }

        const skip = (page - 1) * limit;

        const [posts, total] = await Promise.all([
            BlogPost.find(query)
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            BlogPost.countDocuments(query),
        ]);

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
        console.error("Get my posts error:", error);
        return apiResponse.serverError("Failed to fetch your posts");
    }
}
