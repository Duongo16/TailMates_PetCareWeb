import mongoose, { Schema, Document, Model } from "mongoose";

// ==================== Enums ====================
export enum PostPrivacy {
  PUBLIC = "PUBLIC",     // Tất cả mọi người xem được
  FRIENDS = "FRIENDS",   // Chỉ bạn bè
  PRIVATE = "PRIVATE",   // Chỉ mình
}

// ==================== Sub-Schemas ====================
interface ICloudinaryImage {
  url: string;
  public_id: string;
}

// ==================== Main Interface ====================
export interface ISocialPost extends Document {
  _id: mongoose.Types.ObjectId;
  author_id: mongoose.Types.ObjectId;      // ref User
  content: string;                          // Nội dung bài viết
  images: ICloudinaryImage[];              // Nhiều ảnh (Cloudinary)
  privacy: PostPrivacy;
  like_count: number;
  comment_count: number;                   // Denormalized counter
  is_edited: boolean;
  pet_tags: mongoose.Types.ObjectId[];     // Tag thú cưng (ref Pet)
  user_tags: mongoose.Types.ObjectId[];    // Tag bạn bè (ref User)
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

const SocialPostSchema = new Schema<ISocialPost>(
  {
    author_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author is required"],
    },
    content: {
      type: String,
      trim: true,
      maxlength: [5000, "Content cannot exceed 5000 characters"],
      default: "",
    },
    images: {
      type: [CloudinaryImageSchema],
      default: [],
      validate: {
        validator: function (v: ICloudinaryImage[]) {
          return v.length <= 10; // Tối đa 10 ảnh
        },
        message: "Cannot attach more than 10 images",
      },
    },
    privacy: {
      type: String,
      enum: Object.values(PostPrivacy),
      default: PostPrivacy.PUBLIC,
    },
    like_count: {
      type: Number,
      default: 0,
      min: 0,
    },
    comment_count: {
      type: Number,
      default: 0,
      min: 0,
    },
    is_edited: {
      type: Boolean,
      default: false,
    },
    pet_tags: [
      {
        type: Schema.Types.ObjectId,
        ref: "Pet",
      },
    ],
    user_tags: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// ==================== Validation ====================
SocialPostSchema.pre("validate", async function () {
  // Phải có ít nhất content hoặc ít nhất 1 ảnh
  if (!this.content?.trim() && (!this.images || this.images.length === 0)) {
    throw new Error("Post must have either content or at least one image");
  }
});

// ==================== Indexes ====================
SocialPostSchema.index({ author_id: 1, created_at: -1 }); // Lấy posts của 1 user
SocialPostSchema.index({ created_at: -1 });                 // Feed toàn bộ (mới nhất)
SocialPostSchema.index({ privacy: 1, created_at: -1 });    // Filter theo privacy
SocialPostSchema.index({ user_tags: 1 });                   // Tag tìm posts được tag

// ==================== Model Export ====================
const SocialPost: Model<ISocialPost> =
  mongoose.models.SocialPost ||
  mongoose.model<ISocialPost>("SocialPost", SocialPostSchema);

export default SocialPost;
