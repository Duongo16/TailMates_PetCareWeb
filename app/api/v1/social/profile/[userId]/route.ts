import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import SocialPost from "@/models/SocialPost";
import Friendship, { FriendshipStatus } from "@/models/Friendship";
import Pet from "@/models/Pet";
import { authenticate, apiResponse } from "@/lib/auth";
import mongoose from "mongoose";

// GET /api/v1/social/profile/[userId] - Lấy thông tin trang cá nhân
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { user, error } = await authenticate(request);
    if (error) return error;

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return apiResponse.badRequest("Invalid user ID");
    }

    const targetId = new mongoose.Types.ObjectId(userId);
    const isOwn = user!._id.toString() === userId;

    // Lấy thông tin user target
    const targetUser = await User.findById(targetId)
      .select("full_name avatar role created_at merchant_profile _id")
      .lean();

    if (!targetUser) return apiResponse.notFound("User not found");

    // Kiểm tra quan hệ bạn bè
    const friendship = await Friendship.findOne({
      $or: [
        { requester_id: user!._id, recipient_id: targetId },
        { requester_id: targetId, recipient_id: user!._id },
      ],
    }).lean();

    let friendshipStatus: string | null = null;
    let friendshipId: string | null = null;
    let friendshipRole: "requester" | "recipient" | null = null;

    if (friendship) {
      const f = friendship as any;
      friendshipStatus = f.status;
      friendshipId = f._id.toString();
      friendshipRole =
        f.requester_id.toString() === user!._id.toString()
          ? "requester"
          : "recipient";
    }

    const isFriend = friendshipStatus === FriendshipStatus.ACCEPTED;

    // Lấy số thống kê
    const [friendCount, postCount, pets] = await Promise.all([
      Friendship.countDocuments({
        $or: [
          { requester_id: targetId, status: FriendshipStatus.ACCEPTED },
          { recipient_id: targetId, status: FriendshipStatus.ACCEPTED },
        ],
      }),
      SocialPost.countDocuments({
        author_id: targetId,
        privacy: isOwn ? { $in: ["PUBLIC", "FRIENDS", "PRIVATE"] } : isFriend ? { $in: ["PUBLIC", "FRIENDS"] } : "PUBLIC",
      }),
      // Lấy danh sách thú cưng (public info)
      Pet.find({ owner_id: targetId })
        .select("name species breed avatar_url gender _id")
        .limit(10)
        .lean(),
    ]);

    return apiResponse.success({
      user: targetUser,
      stats: {
        friend_count: friendCount,
        post_count: postCount,
        pet_count: pets.length,
      },
      pets,
      friendship: friendship
        ? {
            id: friendshipId,
            status: friendshipStatus,
            role: friendshipRole, // Để biết mình có thể accept/reject không
          }
        : null,
      is_own: isOwn,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return apiResponse.serverError("Failed to fetch profile");
  }
}
