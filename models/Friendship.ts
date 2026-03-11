import mongoose, { Schema, Document, Model } from "mongoose";

// ==================== Enums ====================
export enum FriendshipStatus {
  PENDING = "PENDING",     // Đang chờ phản hồi
  ACCEPTED = "ACCEPTED",   // Đã là bạn bè
  REJECTED = "REJECTED",   // Đã từ chối
  BLOCKED = "BLOCKED",     // Đã chặn
}

// ==================== Main Interface ====================
export interface IFriendship extends Document {
  _id: mongoose.Types.ObjectId;
  requester_id: mongoose.Types.ObjectId;   // Người gửi lời mời
  recipient_id: mongoose.Types.ObjectId;   // Người nhận lời mời
  status: FriendshipStatus;
  responded_at?: Date;                     // Thời điểm chấp nhận/từ chối
  created_at: Date;
  updated_at: Date;
}

// ==================== Schema Definition ====================
const FriendshipSchema = new Schema<IFriendship>(
  {
    requester_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Requester is required"],
    },
    recipient_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recipient is required"],
    },
    status: {
      type: String,
      enum: Object.values(FriendshipStatus),
      default: FriendshipStatus.PENDING,
    },
    responded_at: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// ==================== Validation ====================
FriendshipSchema.pre("validate", async function () {
  // Không thể kết bạn với chính mình
  if (
    this.requester_id &&
    this.recipient_id &&
    this.requester_id.toString() === this.recipient_id.toString()
  ) {
    throw new Error("Cannot send friend request to yourself");
  }
});

// ==================== Indexes ====================
// Unique: mỗi cặp user chỉ có 1 quan hệ (theo thứ tự requester → recipient)
FriendshipSchema.index(
  { requester_id: 1, recipient_id: 1 },
  { unique: true }
);
// Tìm nhanh lời mời đến 1 user (recipient)
FriendshipSchema.index({ recipient_id: 1, status: 1 });
// Tìm nhanh lời mời đi từ 1 user (requester)
FriendshipSchema.index({ requester_id: 1, status: 1 });

// ==================== Static Methods ====================
// Helper: kiểm tra 2 user có phải bạn bè không (regardless of who sent the request)
FriendshipSchema.statics.areFriends = async function (
  userAId: mongoose.Types.ObjectId,
  userBId: mongoose.Types.ObjectId
): Promise<boolean> {
  const friendship = await this.findOne({
    $or: [
      { requester_id: userAId, recipient_id: userBId, status: FriendshipStatus.ACCEPTED },
      { requester_id: userBId, recipient_id: userAId, status: FriendshipStatus.ACCEPTED },
    ],
  });
  return !!friendship;
};

// Helper: lấy danh sách bạn bè IDs của 1 user
FriendshipSchema.statics.getFriendIds = async function (
  userId: mongoose.Types.ObjectId
): Promise<mongoose.Types.ObjectId[]> {
  const friendships = await this.find({
    $or: [
      { requester_id: userId, status: FriendshipStatus.ACCEPTED },
      { recipient_id: userId, status: FriendshipStatus.ACCEPTED },
    ],
  }).select("requester_id recipient_id");

  return friendships.map((f: IFriendship) =>
    f.requester_id.toString() === userId.toString()
      ? f.recipient_id
      : f.requester_id
  );
};

// ==================== Model Export ====================
const Friendship: Model<IFriendship> =
  mongoose.models.Friendship ||
  mongoose.model<IFriendship>("Friendship", FriendshipSchema);

export default Friendship;
