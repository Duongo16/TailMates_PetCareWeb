import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import BlogPost, { BlogStatus } from "@/models/BlogPost";
import BlogVote, { VoteType } from "@/models/BlogVote";
import User from "@/models/User";
import { apiResponse, verifyToken } from "@/lib/auth";

// POST /api/v1/blog/[id]/vote - Vote on a blog post
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        const token = request.headers.get("authorization")?.replace("Bearer ", "");
        if (!token) {
            return apiResponse.unauthorized("Authentication required to vote");
        }

        const decoded = await verifyToken(token);
        if (!decoded) {
            return apiResponse.unauthorized("Invalid token");
        }

        const userId = decoded.userId;

        // Verify user exists and is CUSTOMER or MERCHANT
        const user = await User.findById(userId);
        if (!user) {
            return apiResponse.unauthorized("User not found");
        }

        if (!["CUSTOMER", "MERCHANT"].includes(user.role)) {
            return apiResponse.forbidden("Only customers and merchants can vote");
        }

        // Get blog ID from params
        const { id: blogId } = await params;
        const post = await BlogPost.findById(blogId);
        if (!post) {
            return apiResponse.notFound("Blog post not found");
        }

        if (post.status !== BlogStatus.PUBLISHED) {
            return apiResponse.badRequest("Cannot vote on unpublished posts");
        }

        const body = await request.json();
        const { vote_type } = body;

        // vote_type can be "LIKE", "DISLIKE", or null (to remove vote)
        if (vote_type && !Object.values(VoteType).includes(vote_type)) {
            return apiResponse.badRequest("Invalid vote type. Must be LIKE, DISLIKE, or null");
        }

        // Find existing vote
        const existingVote = await BlogVote.findOne({
            blog_id: blogId,
            user_id: userId,
        });

        if (vote_type === null) {
            // Remove vote
            if (existingVote) {
                // Decrement count
                if (existingVote.vote_type === VoteType.LIKE) {
                    post.like_count = Math.max(0, post.like_count - 1);
                } else {
                    post.dislike_count = Math.max(0, post.dislike_count - 1);
                }
                await post.save();
                await BlogVote.findByIdAndDelete(existingVote._id);
            }

            return apiResponse.success({
                like_count: post.like_count,
                dislike_count: post.dislike_count,
                user_vote: null,
            }, "Vote removed");
        }

        if (existingVote) {
            // Update existing vote
            if (existingVote.vote_type === vote_type) {
                // Same vote, no change
                return apiResponse.success({
                    like_count: post.like_count,
                    dislike_count: post.dislike_count,
                    user_vote: vote_type,
                }, "Vote already recorded");
            }

            // Switch vote
            if (existingVote.vote_type === VoteType.LIKE) {
                post.like_count = Math.max(0, post.like_count - 1);
                post.dislike_count += 1;
            } else {
                post.dislike_count = Math.max(0, post.dislike_count - 1);
                post.like_count += 1;
            }

            existingVote.vote_type = vote_type;
            await existingVote.save();
            await post.save();

            return apiResponse.success({
                like_count: post.like_count,
                dislike_count: post.dislike_count,
                user_vote: vote_type,
            }, "Vote updated");
        } else {
            // Create new vote
            await BlogVote.create({
                blog_id: blogId,
                user_id: userId,
                vote_type,
            });

            // Increment count
            if (vote_type === VoteType.LIKE) {
                post.like_count += 1;
            } else {
                post.dislike_count += 1;
            }
            await post.save();

            return apiResponse.success({
                like_count: post.like_count,
                dislike_count: post.dislike_count,
                user_vote: vote_type,
            }, "Vote recorded");
        }
    } catch (error) {
        console.error("Vote blog post error:", error);
        return apiResponse.serverError("Failed to vote on blog post");
    }
}
