import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Friendship, { FriendshipStatus } from "@/models/Friendship";
import { authenticate, apiResponse } from "@/lib/auth";
import mongoose from "mongoose";
import { notifyFriendRequest, notifyFriendAccepted } from "@/lib/notification-service";

// POST /api/v1/social/friends/request - Gửi lời mời kết bạn
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    await connectDB();

    const body = await request.json();
    const { recipient_id } = body;

    if (!recipient_id) {
      return apiResponse.badRequest("recipient_id is required");
    }

    if (!mongoose.Types.ObjectId.isValid(recipient_id)) {
      return apiResponse.badRequest("Invalid recipient ID");
    }

    // Không thể gửi cho chính mình
    if (recipient_id === user!._id.toString()) {
      return apiResponse.badRequest("Cannot send friend request to yourself");
    }

    const recipientId = new mongoose.Types.ObjectId(recipient_id);

    // Kiểm tra đã có quan hệ chưa (theo cả 2 chiều)
    const existing = await Friendship.findOne({
      $or: [
        { requester_id: user!._id, recipient_id: recipientId },
        { requester_id: recipientId, recipient_id: user!._id },
      ],
    });

    if (existing) {
      if (existing.status === FriendshipStatus.ACCEPTED) {
        return apiResponse.error("Already friends", 409);
      }
      if (existing.status === FriendshipStatus.PENDING) {
        // Nếu người kia đã gửi cho mình → tự động tạo quan hệ
        if (existing.recipient_id.toString() === user!._id.toString()) {
          existing.status = FriendshipStatus.ACCEPTED;
          existing.responded_at = new Date();
          await existing.save();

          // Thông báo cho người kia biết mình đã accept (tự động)
          await notifyFriendAccepted(existing.requester_id.toString(), user?.full_name || "Một người dùng");

          return apiResponse.success(existing, "Friend request accepted automatically");
        }
        return apiResponse.error("Friend request already sent", 409);
      }
      if (existing.status === FriendshipStatus.BLOCKED) {
        return apiResponse.forbidden("Cannot send friend request to this user");
      }
      // REJECTED → cho phép gửi lại
      existing.status = FriendshipStatus.PENDING;
      existing.requester_id = user!._id;
      existing.recipient_id = recipientId;
      existing.responded_at = undefined;
      await existing.save();

      // Thông báo có lời mời mới (gửi lại)
      await notifyFriendRequest(recipient_id, user?.full_name || "Một người dùng");

      return apiResponse.created(existing, "Friend request sent");
    }

    const friendship = await Friendship.create({
      requester_id: user!._id,
      recipient_id: recipientId,
      status: FriendshipStatus.PENDING,
    });

    // Thông báo có lời mời mới
    await notifyFriendRequest(recipient_id, user?.full_name || "Một người dùng");

    return apiResponse.created(friendship, "Friend request sent successfully");
  } catch (error) {
    console.error("Send friend request error:", error);
    return apiResponse.serverError("Failed to send friend request");
  }
}
