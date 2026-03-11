import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Friendship, { FriendshipStatus } from "@/models/Friendship";
import { authenticate, apiResponse } from "@/lib/auth";
import mongoose from "mongoose";

// DELETE /api/v1/social/friends/[id] - Hủy kết bạn hoặc hủy lời mời đã gửi
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
      return apiResponse.badRequest("Invalid friendship ID");
    }

    const friendship = await Friendship.findById(id);
    if (!friendship) return apiResponse.notFound("Friendship not found");

    // Chỉ các bên liên quan mới được xóa
    const isInvolved =
      friendship.requester_id.toString() === user!._id.toString() ||
      friendship.recipient_id.toString() === user!._id.toString();

    if (!isInvolved) {
      return apiResponse.forbidden("You are not part of this friendship");
    }

    await Friendship.findByIdAndDelete(id);

    const message =
      friendship.status === FriendshipStatus.ACCEPTED
        ? "Unfriended successfully"
        : "Friend request cancelled";

    return apiResponse.success(null, message);
  } catch (error) {
    console.error("Unfriend error:", error);
    return apiResponse.serverError("Failed to remove friendship");
  }
}
