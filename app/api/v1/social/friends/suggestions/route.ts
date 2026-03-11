import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Friendship, { FriendshipStatus } from "@/models/Friendship";
import User from "@/models/User";
import Pet from "@/models/Pet";
import { authenticate, apiResponse } from "@/lib/auth";
import mongoose from "mongoose";

// GET /api/v1/social/friends/suggestions - Gợi ý kết bạn
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    await connectDB();

    const limit = Math.min(
      parseInt(request.nextUrl.searchParams.get("limit") || "10"),
      20
    );

    // 1. Lấy danh sách ID đã có quan hệ (bạn bè + đã gửi/nhận lời mời)
    const existingRelations = await Friendship.find({
      $or: [{ requester_id: user!._id }, { recipient_id: user!._id }],
    })
      .select("requester_id recipient_id")
      .lean();

    const excludeIds = new Set<string>([user!._id.toString()]);
    existingRelations.forEach((f: any) => {
      excludeIds.add(f.requester_id.toString());
      excludeIds.add(f.recipient_id.toString());
    });

    // 2. Lấy IDs bạn bè hiện tại (để tìm bạn của bạn)
    const friendIds = existingRelations
      .filter((f: any) => {
        // Chỉ ACCEPTED
        return true; // Tạm thời lấy tất cả để exclude
      })
      .filter((f: any) => f)
      .map((f: any) =>
        f.requester_id.toString() === user!._id.toString()
          ? f.recipient_id
          : f.requester_id
      );

    // 3. Tìm người dùng active không nằm trong danh sách exclude
    const excludeObjectIds = Array.from(excludeIds).map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    // Ưu tiên: bạn của bạn (mutual friends) + members active
    let suggestions: any[] = [];

    if (friendIds.length > 0) {
      // Lấy bạn của bạn
      const friendOfFriends = await Friendship.find({
        $or: [
          { requester_id: { $in: friendIds }, status: FriendshipStatus.ACCEPTED },
          { recipient_id: { $in: friendIds }, status: FriendshipStatus.ACCEPTED },
        ],
      })
        .select("requester_id recipient_id")
        .lean();

      const mutualCandidateIds = new Set<string>();
      friendOfFriends.forEach((f: any) => {
        const otherId =
          friendIds.some((fid: any) => fid.toString() === f.requester_id.toString())
            ? f.recipient_id.toString()
            : f.requester_id.toString();
        if (!excludeIds.has(otherId)) {
          mutualCandidateIds.add(otherId);
        }
      });

      if (mutualCandidateIds.size > 0) {
        const mutualIds = Array.from(mutualCandidateIds).map(
          (id) => new mongoose.Types.ObjectId(id)
        );
        suggestions = await User.find({
          _id: { $in: mutualIds },
          is_active: true,
        })
          .select("full_name avatar _id")
          .limit(limit)
          .lean();
      }
    }

    // Nếu chưa đủ số lượng → bổ sung user ngẫu nhiên
    if (suggestions.length < limit) {
      const remaining = limit - suggestions.length;
      const existingSuggestionIds = suggestions.map((s: any) => s._id);
      const moreUsers = await User.find({
        _id: {
          $nin: [
            ...excludeObjectIds,
            ...existingSuggestionIds,
          ],
        },
        is_active: true,
      })
        .select("full_name avatar _id")
        .limit(remaining)
        .lean();
      suggestions = [...suggestions, ...moreUsers];
    }

    return apiResponse.success({ suggestions });
  } catch (error) {
    console.error("Get friend suggestions error:", error);
    return apiResponse.serverError("Failed to fetch suggestions");
  }
}
