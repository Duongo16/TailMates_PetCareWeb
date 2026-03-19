import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import SocialPost from "@/models/SocialPost";
import Friendship, { FriendshipStatus } from "@/models/Friendship";
import Reaction, { ReactionTarget } from "@/models/Reaction";
import { authenticate, apiResponse } from "@/lib/auth";
import mongoose from "mongoose";

// GET /api/v1/social/posts - Lấy feed bài viết (phân trang cursor-based)
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);
    const cursor = searchParams.get("cursor"); // Timestamp hoặc ObjectId của post cuối trang trước
    const cursorId = searchParams.get("cursor_id"); // ObjectId (dùng khi cursor là timestamp)
    const userId = searchParams.get("user_id"); // Lọc theo 1 user cụ thể

    // Lấy danh sách bạn bè để filter privacy FRIENDS
    const friendIds = await Friendship.find({
      $or: [
        { requester_id: user!._id, status: FriendshipStatus.ACCEPTED },
        { recipient_id: user!._id, status: FriendshipStatus.ACCEPTED },
      ],
    })
      .select("requester_id recipient_id")
      .lean()
      .then((friendships) =>
        friendships.map((f: any) =>
          f.requester_id.toString() === user!._id.toString()
            ? f.recipient_id
            : f.requester_id
        )
      );

    // Xây dựng query
    const query: any = {
      $or: [
        { privacy: "PUBLIC" },
        { privacy: "FRIENDS", author_id: { $in: friendIds } },
        { privacy: { $in: ["PUBLIC", "FRIENDS", "PRIVATE"] }, author_id: user!._id },
      ],
    };

    // Nếu xem profile của 1 user cụ thể
    if (userId) {
      const targetId = new mongoose.Types.ObjectId(userId);
      const isFriend = friendIds.some((id: any) => id.toString() === userId);
      const isOwn = user!._id.toString() === userId;

      query.$or = isOwn
        ? [{ author_id: targetId }]
        : isFriend
        ? [
            { author_id: targetId, privacy: "PUBLIC" },
            { author_id: targetId, privacy: "FRIENDS" },
          ]
        : [{ author_id: targetId, privacy: "PUBLIC" }];
    }

    // Cursor-based pagination: lấy posts cũ hơn cursor
    if (cursor) {
      // Support both formats:
      // 1) Mobile: cursor = timestamp (ISO string), cursor_id = ObjectId
      // 2) Web: cursor = ObjectId string
      const isTimestamp = cursor.includes("T") || cursor.includes("-");

      if (isTimestamp && cursorId) {
        // Compound cursor: get posts older than (created_at, _id)
        const cursorDate = new Date(cursor);
        const cursorOid = new mongoose.Types.ObjectId(cursorId);
        query.$or = [
          ...(query.$or || []),
        ];
        // Override with compound condition for proper chronological pagination
        query.$and = [
          { $or: query.$or },
          {
            $or: [
              { created_at: { $lt: cursorDate } },
              { created_at: cursorDate, _id: { $lt: cursorOid } },
            ],
          },
        ];
        delete query.$or;
      } else if (isTimestamp) {
        // Fallback: cursor is only a timestamp without cursor_id
        query.created_at = { $lt: new Date(cursor) };
      } else {
        // Web format: cursor is an ObjectId
        query._id = { $lt: new mongoose.Types.ObjectId(cursor) };
      }
    }

    const posts = await SocialPost.find(query)
      .sort({ created_at: -1, _id: -1 }) // Mới nhất trước (compound sort for cursor pagination)
      .limit(limit + 1) // Lấy thêm 1 để check có trang tiếp không
      .populate("author_id", "full_name avatar _id")
      .populate("pet_tags", "name species avatar_url _id")
      .lean();

    const hasMore = posts.length > limit;
    if (hasMore) posts.pop();

    const lastPost = hasMore && posts.length > 0 ? (posts[posts.length - 1] as any) : null;
    const nextCursor = lastPost ? lastPost._id.toString() : null;
    const nextCursorTimestamp = lastPost ? (lastPost.created_at?.toISOString?.() || lastPost.created_at) : null;

    const postIds = posts.map((p) => p._id);
    const userReactions = await Reaction.find({
      target_type: ReactionTarget.POST,
      target_id: { $in: postIds },
      user_id: user!._id,
    }).lean();

    const reactionMap = new Map(
      userReactions.map((r: any) => [r.target_id.toString(), r.reaction_type])
    );

    const postsWithReactions = posts.map((p: any) => ({
      ...p,
      user_reaction: reactionMap.get(p._id.toString()) || null,
    }));

    return apiResponse.success({
      posts: postsWithReactions,
      pagination: {
        has_more: hasMore,
        next_cursor: nextCursor,
        next_cursor_id: nextCursor,
        cursor: nextCursorTimestamp,
        cursor_id: nextCursor,
        limit,
      },
    });
  } catch (error) {
    console.error("Get social posts error:", error);
    return apiResponse.serverError("Failed to fetch posts");
  }
}

// POST /api/v1/social/posts - Tạo bài viết mới
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    await connectDB();

    const body = await request.json();
    const { content, images, privacy, pet_tags, user_tags } = body;

    // Validation: phải có content hoặc images
    if (!content?.trim() && (!images || images.length === 0)) {
      return apiResponse.badRequest("Post must have either content or at least one image");
    }

    const newPost = await SocialPost.create({
      author_id: user!._id,
      content: content?.trim() || "",
      images: images || [],
      privacy: privacy || "PUBLIC",
      pet_tags: pet_tags || [],
      user_tags: user_tags || [],
    });

    // Populate author info cho response
    const populated = await SocialPost.findById(newPost._id)
      .populate("author_id", "full_name avatar _id")
      .lean();

    return apiResponse.created(populated, "Post created successfully");
  } catch (error) {
    console.error("Create social post error:", error);
    return apiResponse.serverError("Failed to create post");
  }
}
