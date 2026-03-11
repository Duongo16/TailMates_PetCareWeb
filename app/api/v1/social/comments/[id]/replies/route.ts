import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import SocialComment from "@/models/SocialComment";
import SocialPost from "@/models/SocialPost";
import Reaction, { ReactionTarget } from "@/models/Reaction";
import { authenticate, apiResponse } from "@/lib/auth";
import mongoose from "mongoose";

// GET /api/v1/social/comments/[id]/replies - Lấy replies của 1 comment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user, error } = await authenticate(request);
    if (error) return error;

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiResponse.badRequest("Invalid comment ID");
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);
    const cursor = searchParams.get("cursor");

    const query: any = {
      parent_id: new mongoose.Types.ObjectId(id),
    };

    if (cursor) {
      query._id = { $gt: new mongoose.Types.ObjectId(cursor) };
    }

    const replies = await SocialComment.find(query)
      .sort({ _id: 1 }) // Cũ nhất trước
      .limit(limit + 1)
      .populate("author_id", "full_name avatar _id")
      .lean();

    const hasMore = replies.length > limit;
    if (hasMore) replies.pop();

    const nextCursor = hasMore && replies.length > 0
      ? (replies[replies.length - 1] as any)._id.toString()
      : null;

    const replyIds = replies.map((r) => r._id);
    const userReactions = await Reaction.find({
      target_type: ReactionTarget.COMMENT,
      target_id: { $in: replyIds },
      user_id: user!._id,
    }).lean();

    const reactionMap = new Map(
      userReactions.map((r: any) => [r.target_id.toString(), r.reaction_type])
    );

    const repliesWithReactions = replies.map((r: any) => ({
      ...r,
      user_reaction: reactionMap.get(r._id.toString()) || null,
    }));

    return apiResponse.success({
      replies: repliesWithReactions,
      pagination: { has_more: hasMore, next_cursor: nextCursor, limit },
    });
  } catch (error) {
    console.error("Get replies error:", error);
    return apiResponse.serverError("Failed to fetch replies");
  }
}

// POST /api/v1/social/comments/[id]/replies - Tạo reply cho 1 comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user, error } = await authenticate(request);
    if (error) return error;

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiResponse.badRequest("Invalid comment ID");
    }

    const parentId = new mongoose.Types.ObjectId(id);

    // Kiểm tra comment cha tồn tại
    const parentComment = await SocialComment.findById(parentId);
    if (!parentComment) return apiResponse.notFound("Comment not found");

    // Chỉ cho phép reply một cấp (depth = 0 → 1)
    if (parentComment.depth >= 1) {
      return apiResponse.badRequest("Cannot reply to a reply. Maximum nesting level reached.");
    }

    const body = await request.json();
    const { content, image } = body;

    if (!content?.trim() && !image) {
      return apiResponse.badRequest("Reply must have content or an image");
    }

    const newReply = await SocialComment.create({
      post_id: parentComment.post_id,
      author_id: user!._id,
      parent_id: parentId,
      content: content?.trim() || "",
      image: image || undefined,
      depth: 1,
    });

    // Tăng reply_count của comment cha & comment_count của post
    await Promise.all([
      SocialComment.findByIdAndUpdate(parentId, { $inc: { reply_count: 1 } }),
      SocialPost.findByIdAndUpdate(parentComment.post_id, { $inc: { comment_count: 1 } }),
    ]);

    const populated = await SocialComment.findById(newReply._id)
      .populate("author_id", "full_name avatar _id")
      .lean();

    return apiResponse.created(populated, "Reply created successfully");
  } catch (error) {
    console.error("Create reply error:", error);
    return apiResponse.serverError("Failed to create reply");
  }
}
