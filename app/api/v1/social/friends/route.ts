import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Friendship, { FriendshipStatus } from "@/models/Friendship";
import { authenticate, apiResponse } from "@/lib/auth";
import mongoose from "mongoose";

// GET /api/v1/social/friends - Lấy danh sách bạn bè của user hiện tại (hoặc user khác)
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const targetUserId = searchParams.get("user_id") || user!._id.toString();
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return apiResponse.badRequest("Invalid user ID");
    }

    const userId = new mongoose.Types.ObjectId(targetUserId);
    const skip = (page - 1) * limit;

    const [friendships, total] = await Promise.all([
      Friendship.find({
        $or: [
          { requester_id: userId, status: FriendshipStatus.ACCEPTED },
          { recipient_id: userId, status: FriendshipStatus.ACCEPTED },
        ],
      })
        .skip(skip)
        .limit(limit)
        .populate("requester_id", "full_name avatar _id")
        .populate("recipient_id", "full_name avatar _id")
        .lean(),
      Friendship.countDocuments({
        $or: [
          { requester_id: userId, status: FriendshipStatus.ACCEPTED },
          { recipient_id: userId, status: FriendshipStatus.ACCEPTED },
        ],
      }),
    ]);

    // Normalize: trả về phía "kia" là bạn bè
    const friends = friendships.map((f: any) => {
      const friend =
        f.requester_id._id.toString() === targetUserId
          ? f.recipient_id
          : f.requester_id;
      return {
        friendship_id: f._id,
        friend,
        since: f.updated_at, // Ngày accept
      };
    });

    return apiResponse.success({
      friends,
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get friends error:", error);
    return apiResponse.serverError("Failed to fetch friends");
  }
}
