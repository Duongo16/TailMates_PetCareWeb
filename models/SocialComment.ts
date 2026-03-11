import mongoose, { Schema, Document, Model } from "mongoose";

// ==================== Sub-Schemas ====================
interface ICloudinaryImage {
  url: string;
  public_id: string;
}

// ==================== Main Interface ====================
export interface ISocialComment extends Document {
  _id: mongoose.Types.ObjectId;
  post_id: mongoose.Types.ObjectId;            // ref SocialPost
  author_id: mongoose.Types.ObjectId;          // ref User
  parent_id?: mongoose.Types.ObjectId | null;  // ref SocialComment (null = top-level)
  content: string;
  image?: ICloudinaryImage;                    // Tùy chọn đính kèm 1 ảnh
  like_count: number;                          // Denormalized
  reply_count: number;                         // Denormalized (chỉ áp dụng top-level)
  depth: number;                               // 0 = top-level, 1 = reply
  is_edited: boolean;
  created_at: Date;
  updated_at: Date;
}

// ==================== Schema Definition ====================
const CloudinaryImageSchema = new Schema<ICloudinaryImage>(
  {
    url: { type: String, required: true },
    public_id: { type: String, required: true },
  },
  { _id: false }
);

const SocialCommentSchema = new Schema<ISocialComment>(
  {
    post_id: {
      type: Schema.Types.ObjectId,
      ref: "SocialPost",
      required: [true, "Post is required"],
    },
    author_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author is required"],
    },
    parent_id: {
      type: Schema.Types.ObjectId,
      ref: "SocialComment",
      default: null,
    },
    content: {
      type: String,
      trim: true,
      maxlength: [2000, "Comment cannot exceed 2000 characters"],
      default: "",
    },
    image: CloudinaryImageSchema,
    like_count: {
      type: Number,
      default: 0,
      min: 0,
    },
    reply_count: {
      type: Number,
      default: 0,
      min: 0,
    },
    depth: {
      type: Number,
      default: 0,
      min: 0,
      max: 1, // Chỉ cho phép 2 cấp: comment (0) và reply (1)
    },
    is_edited: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// ==================== Validation ====================
SocialCommentSchema.pre("validate", async function () {
  // Phải có ít nhất content hoặc ảnh
  if (!this.content?.trim() && !this.image) {
    throw new Error("Comment must have either content or an image");
  }
});

// ==================== Indexes ====================
SocialCommentSchema.index({ post_id: 1, parent_id: 1, created_at: 1 }); // Lấy top-level comments của post
SocialCommentSchema.index({ parent_id: 1, created_at: 1 });               // Lấy replies của 1 comment
SocialCommentSchema.index({ author_id: 1 });                              // Lấy comments của 1 user

// ==================== Model Export ====================
const SocialComment: Model<ISocialComment> =
  mongoose.models.SocialComment ||
  mongoose.model<ISocialComment>("SocialComment", SocialCommentSchema);

export default SocialComment;
