import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import SocialPost from "@/models/SocialPost";
import Reaction, { ReactionTarget } from "@/models/Reaction";
import { authenticate, apiResponse } from "@/lib/auth";
import mongoose from "mongoose";

// GET /api/v1/social/posts/[id] - Lấy chi tiết 1 bài viết
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

    const post = await SocialPost.findById(id)
      .populate("author_id", "full_name avatar _id")
      .populate("pet_tags", "name species avatar_url _id")
      .populate("user_tags", "full_name avatar _id")
      .lean();

    if (!post) {
      return apiResponse.notFound("Post not found");
    }

    // Kiểm tra quyền xem theo privacy
    const postObj = post as any;
    const isOwner = postObj.author_id._id.toString() === user!._id.toString();

    if (!isOwner && postObj.privacy === "PRIVATE") {
      return apiResponse.forbidden("This post is private");
    }

    // Lấy reaction của user hiện tại
    const userReaction = await Reaction.findOne({
      target_type: ReactionTarget.POST,
      target_id: post._id,
      user_id: user!._id,
    }).lean();

    return apiResponse.success({
      ...post,
      user_reaction: userReaction ? (userReaction as any).reaction_type : null,
    });
  } catch (error) {
    console.error("Get social post error:", error);
    return apiResponse.serverError("Failed to fetch post");
  }
}

// PUT /api/v1/social/posts/[id] - Sửa bài viết (chỉ author)
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
      return apiResponse.badRequest("Invalid post ID");
    }

    const post = await SocialPost.findById(id);
    if (!post) return apiResponse.notFound("Post not found");

    // Chỉ author mới được sửa
    if (post.author_id.toString() !== user!._id.toString()) {
      return apiResponse.forbidden("You can only edit your own posts");
    }

    const body = await request.json();
    const { content, images, privacy, pet_tags, user_tags } = body;

    // Validation: phải có content hoặc images sau khi sửa
    const newContent = content !== undefined ? content : post.content;
    const newImages = images !== undefined ? images : post.images;
    if (!newContent?.trim() && (!newImages || newImages.length === 0)) {
      return apiResponse.badRequest("Post must have either content or at least one image");
    }

    const updated = await SocialPost.findByIdAndUpdate(
      id,
      {
        $set: {
          ...(content !== undefined && { content: content.trim() }),
          ...(images !== undefined && { images }),
          ...(privacy !== undefined && { privacy }),
          ...(pet_tags !== undefined && { pet_tags }),
          ...(user_tags !== undefined && { user_tags }),
          is_edited: true,
        },
      },
      { new: true, runValidators: true }
    )
      .populate("author_id", "full_name avatar _id")
      .lean();

    return apiResponse.success(updated, "Post updated successfully");
  } catch (error) {
    console.error("Update social post error:", error);
    return apiResponse.serverError("Failed to update post");
  }
}

// DELETE /api/v1/social/posts/[id] - Xóa bài viết
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
      return apiResponse.badRequest("Invalid post ID");
    }

    const post = await SocialPost.findById(id);
    if (!post) return apiResponse.notFound("Post not found");

    // Chỉ author hoặc admin/manager mới được xóa
    const isOwner = post.author_id.toString() === user!._id.toString();
    const isAdmin = ["ADMIN", "MANAGER"].includes(user!.role);

    if (!isOwner && !isAdmin) {
      return apiResponse.forbidden("You can only delete your own posts");
    }

    await SocialPost.findByIdAndDelete(id);

    // Xóa reactions và comments liên quan (cleanup)
    const { default: Reaction } = await import("@/models/Reaction");
    const { default: SocialComment } = await import("@/models/SocialComment");

    await Promise.all([
      Reaction.deleteMany({ target_type: "POST", target_id: post._id }),
      SocialComment.deleteMany({ post_id: post._id }),
    ]);

    return apiResponse.success(null, "Post deleted successfully");
  } catch (error) {
    console.error("Delete social post error:", error);
    return apiResponse.serverError("Failed to delete post");
  }
}
