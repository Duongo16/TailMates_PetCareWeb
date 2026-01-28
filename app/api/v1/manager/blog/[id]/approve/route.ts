import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import BlogPost, { BlogStatus } from "@/models/BlogPost";
import User from "@/models/User";
import { apiResponse, verifyToken } from "@/lib/auth";

// POST /api/v1/manager/blog/[id]/approve - Approve or reject blog post
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
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

        // Verify user is MANAGER
        const user = await User.findById(decoded.userId);
        if (!user || user.role !== "MANAGER") {
            return apiResponse.forbidden("Only managers can approve posts");
        }

        const resolvedParams = await params;
        const blogId = resolvedParams.id;
        console.log('APPROVE - Received blog ID:', blogId, 'Type:', typeof blogId);

        const post = await BlogPost.findById(blogId);

        if (!post) {
            console.log('APPROVE - Post not found for ID:', blogId);
            return apiResponse.notFound("Blog post not found");
        }

        const body = await request.json();
        const { action, manager_note } = body;

        if (!["APPROVE", "REJECT"].includes(action)) {
            return apiResponse.badRequest("Action must be APPROVE or REJECT");
        }

        if (action === "APPROVE") {
            post.status = BlogStatus.PUBLISHED;
            post.published_at = new Date();
            post.manager_id = user._id;
            post.reviewed_at = new Date();
            if (manager_note) {
                post.manager_note = manager_note;
            }

            await post.save();

            // TODO: Create notification for author about approval

            return apiResponse.success(post, "Blog post approved and published");
        } else {
            // REJECT
            post.status = BlogStatus.REJECTED;
            post.manager_id = user._id;
            post.reviewed_at = new Date();
            post.manager_note = manager_note || "Post rejected by manager";

            await post.save();

            // TODO: Create notification for author about rejection

            return apiResponse.success(post, "Blog post rejected");
        }
    } catch (error) {
        console.error("Approve/reject blog post error:", error);
        return apiResponse.serverError("Failed to process blog post");
    }
}
