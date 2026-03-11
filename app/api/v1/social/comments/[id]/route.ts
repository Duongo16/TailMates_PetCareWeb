import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import SocialComment from "@/models/SocialComment";
import SocialPost from "@/models/SocialPost";
import { authenticate, apiResponse } from "@/lib/auth";
import mongoose from "mongoose";

// PUT /api/v1/social/comments/[id] - Sửa comment
export async function PUT(
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

    const comment = await SocialComment.findById(id);
    if (!comment) return apiResponse.notFound("Comment not found");

    // Chỉ tác giả mới được sửa
    if (comment.author_id.toString() !== user!._id.toString()) {
      return apiResponse.forbidden("You can only edit your own comments");
    }

    const body = await request.json();
    const { content, image } = body;

    const newContent = content !== undefined ? content.trim() : comment.content;
    const newImage = image !== undefined ? image : comment.image;

    if (!newContent && !newImage) {
      return apiResponse.badRequest("Comment must have content or an image");
    }

    const updated = await SocialComment.findByIdAndUpdate(
      id,
      {
        $set: {
          ...(content !== undefined && { content: content.trim() }),
          ...(image !== undefined && { image }),
          is_edited: true,
        },
      },
      { new: true, runValidators: true }
    )
      .populate("author_id", "full_name avatar _id")
      .lean();

    return apiResponse.success(updated, "Comment updated successfully");
  } catch (error) {
    console.error("Update comment error:", error);
    return apiResponse.serverError("Failed to update comment");
  }
}

// DELETE /api/v1/social/comments/[id] - Xóa comment
export async function DELETE(
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

    const comment = await SocialComment.findById(id);
    if (!comment) return apiResponse.notFound("Comment not found");

    const isOwner = comment.author_id.toString() === user!._id.toString();
    const isAdmin = ["ADMIN", "MANAGER"].includes(user!.role);

    if (!isOwner && !isAdmin) {
      return apiResponse.forbidden("You can only delete your own comments");
    }

    const postId = comment.post_id;
    const isTopLevel = !comment.parent_id;

    await SocialComment.findByIdAndDelete(id);

    // Xóa tất cả replies nếu là top-level comment
    let deletedRepliesCount = 0;
    if (isTopLevel) {
      const result = await SocialComment.deleteMany({ parent_id: comment._id });
      deletedRepliesCount = result.deletedCount;
    }

    // Giảm comment_count trên post (có thể không chính xác hoàn toàn nếu có replies)
    // Dùng countDocuments để recalculate chính xác hơn
    const actualCount = await SocialComment.countDocuments({ post_id: postId });
    await SocialPost.findByIdAndUpdate(postId, {
      $set: { comment_count: actualCount },
    });

    // Nếu là reply, giảm reply_count của parent
    if (!isTopLevel && comment.parent_id) {
      await SocialComment.findByIdAndUpdate(comment.parent_id, {
        $inc: { reply_count: -1 },
      });
    }

    // Xóa reactions liên quan
    const { default: Reaction } = await import("@/models/Reaction");
    await Reaction.deleteMany({ target_type: "COMMENT", target_id: comment._id });

    return apiResponse.success(null, "Comment deleted successfully");
  } catch (error) {
    console.error("Delete comment error:", error);
    return apiResponse.serverError("Failed to delete comment");
  }
}
