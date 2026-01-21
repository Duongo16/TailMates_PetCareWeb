import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import BlogPost, { BlogStatus } from "@/models/BlogPost";
import { apiResponse, verifyToken } from "@/lib/auth";
import User from "@/models/User";

// POST /api/v1/blog/[id]/submit - Submit post for review
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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

        const resolvedParams = await params;
        const blogId = resolvedParams.id;
        const post = await BlogPost.findById(blogId);

        if (!post) {
            return apiResponse.notFound("Blog post not found");
        }

        // Only author can submit
        if (post.author_id.toString() !== decoded.userId) {
            return apiResponse.forbidden("You can only submit your own posts");
        }

        // Can only submit DRAFT posts
        if (post.status !== BlogStatus.DRAFT) {
            return apiResponse.badRequest(`Cannot submit post with status: ${post.status}`);
        }

        // Update status to PENDING
        post.status = BlogStatus.PENDING;
        await post.save();

        // TODO: Create notification for managers

        return apiResponse.success(post, "Blog post submitted for review");
    } catch (error) {
        console.error("Submit blog post error:", error);
        return apiResponse.serverError("Failed to submit blog post");
    }
}
