import mongoose, { Schema, Document, Model } from "mongoose";

// ==================== Enums ====================
export enum ReactionType {
  LIKE = "LIKE",
  LOVE = "LOVE",
  HAHA = "HAHA",
  WOW = "WOW",
  SAD = "SAD",
  ANGRY = "ANGRY",
}

export enum ReactionTarget {
  POST = "POST",
  COMMENT = "COMMENT",
}

// ==================== Main Interface ====================
export interface IReaction extends Document {
  _id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;      // ref User
  target_type: ReactionTarget;           // POST hoặc COMMENT
  target_id: mongoose.Types.ObjectId;    // ID của SocialPost hoặc SocialComment
  reaction_type: ReactionType;
  created_at: Date;
  updated_at: Date;
}

// ==================== Schema Definition ====================
const ReactionSchema = new Schema<IReaction>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    target_type: {
      type: String,
      enum: Object.values(ReactionTarget),
      required: [true, "Target type is required"],
    },
    target_id: {
      type: Schema.Types.ObjectId,
      required: [true, "Target ID is required"],
    },
    reaction_type: {
      type: String,
      enum: Object.values(ReactionType),
      required: [true, "Reaction type is required"],
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// ==================== Indexes ====================
// Unique: 1 user chỉ react 1 lần trên mỗi target
ReactionSchema.index(
  { user_id: 1, target_type: 1, target_id: 1 },
  { unique: true }
);
// Lấy tất cả reactions của 1 target (post/comment)
ReactionSchema.index({ target_type: 1, target_id: 1 });
// Lấy tất cả reactions của 1 user
ReactionSchema.index({ user_id: 1, target_type: 1 });

// ==================== Model Export ====================
const Reaction: Model<IReaction> =
  mongoose.models.Reaction ||
  mongoose.model<IReaction>("Reaction", ReactionSchema);

export default Reaction;
