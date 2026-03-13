import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import SocialComment from "@/models/SocialComment";
import SocialPost from "@/models/SocialPost";
import Reaction, { ReactionTarget } from "@/models/Reaction";
import { authenticate, apiResponse } from "@/lib/auth";
import mongoose from "mongoose";
import { notifySocialComment } from "@/lib/notification-service";

// GET /api/v1/social/posts/[id]/comments - Lấy top-level comments
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
      return apiResponse.badRequest("Invalid post ID");
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const cursor = searchParams.get("cursor");

    const query: any = {
      post_id: new mongoose.Types.ObjectId(id),
      parent_id: null, // Chỉ lấy top-level comments
    };

    if (cursor) {
      query._id = { $lt: new mongoose.Types.ObjectId(cursor) }; // Mới hơn trước, cũ sau
    }

    const comments = await SocialComment.find(query)
      .sort({ _id: -1 }) // Mới nhất lên trên
      .limit(limit + 1)
      .populate("author_id", "full_name avatar _id")
      .lean();

    const hasMore = comments.length > limit;
    if (hasMore) comments.pop();

    const nextCursor = hasMore && comments.length > 0
      ? (comments[comments.length - 1] as any)._id.toString()
      : null;

    const commentIds = comments.map((c) => c._id);
    const userReactions = await Reaction.find({
      target_type: ReactionTarget.COMMENT,
      target_id: { $in: commentIds },
      user_id: user!._id,
    }).lean();

    const reactionMap = new Map(
      userReactions.map((r: any) => [r.target_id.toString(), r.reaction_type])
    );

    const commentsWithReactions = comments.map((c: any) => ({
      ...c,
      user_reaction: reactionMap.get(c._id.toString()) || null,
    }));

    return apiResponse.success({
      comments: commentsWithReactions,
      pagination: {
        has_more: hasMore,
        next_cursor: nextCursor,
        limit,
      },
    });
  } catch (error) {
    console.error("Get comments error:", error);
    return apiResponse.serverError("Failed to fetch comments");
  }
}

// POST /api/v1/social/posts/[id]/comments - Tạo comment mới
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
      return apiResponse.badRequest("Invalid post ID");
    }

    const postId = new mongoose.Types.ObjectId(id);

    // Kiểm tra post tồn tại
    const post = await SocialPost.findById(postId);
    if (!post) return apiResponse.notFound("Post not found");

    const body = await request.json();
    const { content, image } = body;

    if (!content?.trim() && !image) {
      return apiResponse.badRequest("Comment must have content or an image");
    }

    const newComment = await SocialComment.create({
      post_id: postId,
      author_id: user!._id,
      parent_id: null,
      content: content?.trim() || "",
      image: image || undefined,
      depth: 0,
    });

    // Tăng comment_count trên post
    await SocialPost.findByIdAndUpdate(postId, {
      $inc: { comment_count: 1 },
    });

    // Gửi thông báo nếu không phải tự comment bài mình
    if (post.author_id.toString() !== user!._id.toString()) {
      await notifySocialComment(
        post.author_id.toString(),
        user?.full_name || "Một người dùng",
        id,
        content || "Đã gửi một ảnh"
      );
    }

    const populated = await SocialComment.findById(newComment._id)
      .populate("author_id", "full_name avatar _id")
      .lean();

    return apiResponse.created(populated, "Comment created successfully");
  } catch (error) {
    console.error("Create comment error:", error);
    return apiResponse.serverError("Failed to create comment");
  }
}
