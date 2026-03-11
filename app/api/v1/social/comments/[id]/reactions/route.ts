import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Reaction, { ReactionType, ReactionTarget } from "@/models/Reaction";
import SocialComment from "@/models/SocialComment";
import { authenticate, apiResponse } from "@/lib/auth";
import mongoose from "mongoose";

// POST /api/v1/social/comments/[id]/reactions - React hoặc un-react comment
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

    const commentId = new mongoose.Types.ObjectId(id);
    const body = await request.json();
    const { reaction_type } = body;

    if (!Object.values(ReactionType).includes(reaction_type)) {
      return apiResponse.badRequest(
        `Invalid reaction type. Must be one of: ${Object.values(ReactionType).join(", ")}`
      );
    }

    const comment = await SocialComment.findById(commentId);
    if (!comment) return apiResponse.notFound("Comment not found");

    const existing = await Reaction.findOne({
      user_id: user!._id,
      target_type: ReactionTarget.COMMENT,
      target_id: commentId,
    });

    let delta = 0;
    let action: "created" | "updated" | "removed";
    let currentReaction: string | null = null;

    if (!existing) {
      await Reaction.create({
        user_id: user!._id,
        target_type: ReactionTarget.COMMENT,
        target_id: commentId,
        reaction_type,
      });
      delta = 1;
      action = "created";
      currentReaction = reaction_type;
    } else if (existing.reaction_type === reaction_type) {
      await Reaction.findByIdAndDelete(existing._id);
      delta = -1;
      action = "removed";
      currentReaction = null;
    } else {
      await Reaction.findByIdAndUpdate(existing._id, { reaction_type });
      delta = 0;
      action = "updated";
      currentReaction = reaction_type;
    }

    if (delta !== 0) {
      await SocialComment.findByIdAndUpdate(commentId, {
        $inc: { like_count: delta },
      });
    }

    return apiResponse.success(
      { action, current_reaction: currentReaction },
      `Reaction ${action}`
    );
  } catch (error) {
    console.error("React comment error:", error);
    return apiResponse.serverError("Failed to update reaction");
  }
}
