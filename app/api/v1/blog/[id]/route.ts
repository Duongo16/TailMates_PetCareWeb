import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import BlogPost, { BlogStatus } from "@/models/BlogPost";
import User from "@/models/User";
import BlogVote from "@/models/BlogVote";
import { apiResponse, verifyToken } from "@/lib/auth";

// GET /api/v1/blog/[id] - Public blog detail
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        const resolvedParams = await params;
        const blogId = resolvedParams.id;
        console.log('GET - Received blog ID:', blogId);

        const post = await BlogPost.findById(blogId);
        if (!post) {
            return apiResponse.notFound("Blog post not found");
        }

        // Check if user can view this post
        const token = request.headers.get("authorization")?.replace("Bearer ", "");
        let userId: string | null = null;

        if (token) {
            const decoded = await verifyToken(token);
            if (decoded) {
                userId = decoded.userId;
            }
        }

        // Public can only view PUBLISHED posts
        // Author and Manager can view any post
        if (post.status !== BlogStatus.PUBLISHED) {
            if (!userId) {
                return apiResponse.forbidden("This post is not published yet");
            }

            const user = await User.findById(userId);
            if (!user) {
                return apiResponse.forbidden("This post is not published yet");
            }

            const isAuthor = post.author_id.toString() === userId;
            const isManager = ["MANAGER", "ADMIN"].includes(user.role);

            if (!isAuthor && !isManager) {
                return apiResponse.forbidden("This post is not published yet");
            }
        }

        // Increment view count for published posts
        if (post.status === BlogStatus.PUBLISHED) {
            await BlogPost.findByIdAndUpdate(blogId, {
                $inc: { view_count: 1 },
            });
            post.view_count += 1;
        }

        // Get user's vote if authenticated
        let userVote = null;
        if (userId) {
            const vote = await BlogVote.findOne({
                blog_id: blogId,
                user_id: userId,
            });
            userVote = vote ? vote.vote_type : null;
        }

        return apiResponse.success({
            post,
            user_vote: userVote,
        });
    } catch (error) {
        console.error("Get blog post error:", error);
        return apiResponse.serverError("Failed to get blog post");
    }
}

// PUT /api/v1/blog/[id] - Update blog post (Author only)
export async function PUT(
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

        const { id: blogId } = await params;
        console.log('PUT - Received blog ID:', blogId, 'Type:', typeof blogId);

        const post = await BlogPost.findById(blogId);

        if (!post) {
            console.log('PUT - Post not found for ID:', blogId);
            return apiResponse.notFound("Blog post not found");
        }

        // Only author can update
        if (post.author_id.toString() !== decoded.userId) {
            return apiResponse.forbidden("You can only update your own posts");
        }

        const body = await request.json();
        const { title, content, excerpt, featured_image, category, tags } = body;

        // Update fields
        if (title) post.title = title;
        if (content) {
            post.content = content;
            // Regenerate excerpt if content changed and no new excerpt provided
            if (!excerpt) {
                post.excerpt = content.substring(0, 200).replace(/<[^>]*>/g, "") + "...";
            }
        }
        if (excerpt) post.excerpt = excerpt;
        if (featured_image !== undefined) post.featured_image = featured_image;
        if (category) post.category = category;
        if (tags !== undefined) post.tags = tags;

        await post.save();

        return apiResponse.success(post, "Blog post updated successfully");
    } catch (error) {
        console.error("Update blog post error:", error);
        return apiResponse.serverError("Failed to update blog post");
    }
}

// DELETE /api/v1/blog/[id] - Delete blog post (Author or Admin)
export async function DELETE(
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

        const { id: blogId } = await params;
        console.log('DELETE - Received blog ID:', blogId, 'Type:', typeof blogId);

        const post = await BlogPost.findById(blogId);

        if (!post) {
            console.log('DELETE - Post not found for ID:', blogId);
            return apiResponse.notFound("Blog post not found");
        }

        // Get user
        const user = await User.findById(decoded.userId);
        if (!user) {
            return apiResponse.unauthorized("User not found");
        }

        // Only author or admin/manager can delete
        const isAuthor = post.author_id.toString() === decoded.userId;
        const isAdmin = ["ADMIN", "MANAGER"].includes(user.role);

        if (!isAuthor && !isAdmin) {
            return apiResponse.forbidden("You can only delete your own posts");
        }

        // Delete associated votes
        await BlogVote.deleteMany({ blog_id: blogId });

        // Delete post
        await BlogPost.findByIdAndDelete(blogId);

        return apiResponse.success(null, "Blog post deleted successfully");
    } catch (error) {
        console.error("Delete blog post error:", error);
        return apiResponse.serverError("Failed to delete blog post");
    }
}
