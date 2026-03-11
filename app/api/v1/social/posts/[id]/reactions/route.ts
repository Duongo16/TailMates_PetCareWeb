import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Reaction, { ReactionType, ReactionTarget } from "@/models/Reaction";
import SocialPost from "@/models/SocialPost";
import { authenticate, apiResponse } from "@/lib/auth";
import mongoose from "mongoose";
import { notifySocialLike } from "@/lib/notification-service";

// GET /api/v1/social/posts/[id]/reactions - Lấy reactions của 1 post
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

    const postId = new mongoose.Types.ObjectId(id);

    // Đếm theo từng loại reaction
    const [reactionCounts, userReaction] = await Promise.all([
      Reaction.aggregate([
        { $match: { target_type: ReactionTarget.POST, target_id: postId } },
        { $group: { _id: "$reaction_type", count: { $sum: 1 } } },
      ]),
      Reaction.findOne({
        target_type: ReactionTarget.POST,
        target_id: postId,
        user_id: user!._id,
      }).lean(),
    ]);

    // Chuyển về object { LIKE: 5, LOVE: 2, ... }
    const counts: Record<string, number> = {};
    let totalCount = 0;
    
    // Khởi tạo các loại reaction với giá trị 0
    Object.values(ReactionType).forEach(type => {
      counts[type] = 0;
    });

    reactionCounts.forEach((r: any) => {
      counts[r._id] = r.count;
      totalCount += r.count;
    });

    return apiResponse.success({
      counts,
      total: totalCount,
      user_reaction: userReaction ? (userReaction as any).reaction_type : null,
    });
  } catch (error) {
    console.error("Get post reactions error:", error);
    return apiResponse.serverError("Failed to fetch reactions");
  }
}

// POST /api/v1/social/posts/[id]/reactions - React hoặc un-react bài viết
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
    const body = await request.json();
    const { reaction_type } = body;

    // Validate reaction type
    if (!Object.values(ReactionType).includes(reaction_type)) {
      return apiResponse.badRequest(
        `Invalid reaction type. Must be one of: ${Object.values(ReactionType).join(", ")}`
      );
    }

    // Kiểm tra post có tồn tại không
    const post = await SocialPost.findById(postId);
    if (!post) return apiResponse.notFound("Post not found");

    // Tìm reaction hiện tại của user
    const existing = await Reaction.findOne({
      user_id: user!._id,
      target_type: ReactionTarget.POST,
      target_id: postId,
    });

    let delta = 0; // Thay đổi like_count
    let action: "created" | "updated" | "removed";
    let currentReaction: string | null = null;

    if (!existing) {
      // Chưa react → tạo mới
      await Reaction.create({
        user_id: user!._id,
        target_type: ReactionTarget.POST,
        target_id: postId,
        reaction_type,
      });
      delta = 1;
      action = "created";
      currentReaction = reaction_type;
    } else if (existing.reaction_type === reaction_type) {
      // Click cùng loại → bỏ react
      await Reaction.findByIdAndDelete(existing._id);
      delta = -1;
      action = "removed";
      currentReaction = null;
    } else {
      // Đổi loại react
      await Reaction.findByIdAndUpdate(existing._id, { reaction_type });
      delta = 0; // Tổng không đổi, chỉ đổi loại
      action = "updated";
      currentReaction = reaction_type;
    }

    // Gửi thông báo nếu không phải tự react bài mình
    if (action !== "removed" && post.author_id.toString() !== user!._id.toString()) {
      await notifySocialLike(
        post.author_id.toString(),
        user?.full_name || "Một người dùng",
        post._id.toString()
      );
    }

    // Cập nhật denormalized like_count trên post
    if (delta !== 0) {
      await SocialPost.findByIdAndUpdate(postId, {
        $inc: { like_count: delta },
      });
    }

    return apiResponse.success(
      { action, current_reaction: currentReaction },
      `Reaction ${action}`
    );
  } catch (error) {
    console.error("React post error:", error);
    return apiResponse.serverError("Failed to update reaction");
  }
}
