import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Friendship, { FriendshipStatus } from "@/models/Friendship";
import { authenticate, apiResponse } from "@/lib/auth";
import mongoose from "mongoose";
import { notifyFriendAccepted } from "@/lib/notification-service";

// POST /api/v1/social/friends/respond - Chấp nhận hoặc từ chối lời mời kết bạn
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    await connectDB();

    const body = await request.json();
    const { friendship_id, action } = body;

    if (!friendship_id || !action) {
      return apiResponse.badRequest("friendship_id and action are required");
    }

    if (!["accept", "reject"].includes(action)) {
      return apiResponse.badRequest("action must be 'accept' or 'reject'");
    }

    if (!mongoose.Types.ObjectId.isValid(friendship_id)) {
      return apiResponse.badRequest("Invalid friendship ID");
    }

    const friendship = await Friendship.findById(friendship_id);
    if (!friendship) return apiResponse.notFound("Friend request not found");

    // Chỉ recipient mới được phản hồi
    if (friendship.recipient_id.toString() !== user!._id.toString()) {
      return apiResponse.forbidden("You can only respond to requests sent to you");
    }

    if (friendship.status !== FriendshipStatus.PENDING) {
      return apiResponse.badRequest("This friend request has already been responded to");
    }

    friendship.status =
      action === "accept" ? FriendshipStatus.ACCEPTED : FriendshipStatus.REJECTED;
    friendship.responded_at = new Date();
    await friendship.save();

    // Thông báo cho người gửi là mình đã đồng ý
    if (action === "accept") {
      await notifyFriendAccepted(
        friendship.requester_id.toString(),
        user?.full_name || "Một người dùng"
      );
    }

    const message =
      action === "accept"
        ? "Friend request accepted"
        : "Friend request rejected";

    return apiResponse.success(friendship, message);
  } catch (error) {
    console.error("Respond to friend request error:", error);
    return apiResponse.serverError("Failed to respond to friend request");
  }
}
