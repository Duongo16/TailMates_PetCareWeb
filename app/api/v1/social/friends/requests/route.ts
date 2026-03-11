import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Friendship, { FriendshipStatus } from "@/models/Friendship";
import { authenticate, apiResponse } from "@/lib/auth";

// GET /api/v1/social/friends/requests - Lấy lời mời kết bạn đến và đi
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "received"; // "received" | "sent"
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const skip = (page - 1) * limit;

    const query =
      type === "received"
        ? { recipient_id: user!._id, status: FriendshipStatus.PENDING }
        : { requester_id: user!._id, status: FriendshipStatus.PENDING };

    const [requests, total] = await Promise.all([
      Friendship.find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .populate("requester_id", "full_name avatar _id")
        .populate("recipient_id", "full_name avatar _id")
        .lean(),
      Friendship.countDocuments(query),
    ]);

    return apiResponse.success({
      requests,
      type,
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get friend requests error:", error);
    return apiResponse.serverError("Failed to fetch friend requests");
  }
}
