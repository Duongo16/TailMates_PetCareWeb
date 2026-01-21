import mongoose, { Schema, Document, Model } from "mongoose";

// ==================== Enums ====================
export enum BlogStatus {
    DRAFT = "DRAFT",         // Bản nháp, chưa submit
    PENDING = "PENDING",     // Đang chờ duyệt
    PUBLISHED = "PUBLISHED", // Đã được duyệt và public
    REJECTED = "REJECTED",   // Bị từ chối
}

// ==================== Sub-Schemas ====================
interface ICloudinaryImage {
    url: string;
    public_id?: string;
}

// ==================== Main Interface ====================
export interface IBlogPost extends Document {
    _id: mongoose.Types.ObjectId;
    title: string;
    content: string;
    excerpt: string;
    author_id: mongoose.Types.ObjectId;
    author_name: string;
    author_avatar?: ICloudinaryImage;
    featured_image?: ICloudinaryImage;
    category: string;
    tags: string[];
    status: BlogStatus;
    like_count: number;
    dislike_count: number;
    view_count: number;
    manager_id?: mongoose.Types.ObjectId;
    manager_note?: string;
    reviewed_at?: Date;
    published_at?: Date;
    created_at: Date;
    updated_at: Date;
}

// ==================== Schema Definition ====================
const CloudinaryImageSchema = new Schema<ICloudinaryImage>(
    {
        url: { type: String, required: true },
        public_id: { type: String, required: false },
    },
    { _id: false }
);

const BlogPostSchema = new Schema<IBlogPost>(
    {
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
            maxlength: [200, "Title cannot exceed 200 characters"],
        },
        content: {
            type: String,
            required: [true, "Content is required"],
        },
        excerpt: {
            type: String,
            trim: true,
            maxlength: [500, "Excerpt cannot exceed 500 characters"],
        },
        author_id: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Author is required"],
        },
        author_name: {
            type: String,
            required: true,
        },
        author_avatar: CloudinaryImageSchema,
        featured_image: CloudinaryImageSchema,
        category: {
            type: String,
            required: [true, "Category is required"],
            trim: true,
        },
        tags: [
            {
                type: String,
                trim: true,
            },
        ],
        status: {
            type: String,
            enum: Object.values(BlogStatus),
            default: BlogStatus.DRAFT,
        },
        like_count: {
            type: Number,
            default: 0,
            min: 0,
        },
        dislike_count: {
            type: Number,
            default: 0,
            min: 0,
        },
        view_count: {
            type: Number,
            default: 0,
            min: 0,
        },
        manager_id: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        manager_note: {
            type: String,
            trim: true,
        },
        reviewed_at: {
            type: Date,
        },
        published_at: {
            type: Date,
        },
    },
    {
        timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    }
);

// ==================== Indexes ====================
BlogPostSchema.index({ status: 1, published_at: -1 });
BlogPostSchema.index({ author_id: 1, status: 1 });
BlogPostSchema.index({ category: 1, status: 1 });
BlogPostSchema.index({ title: "text", content: "text" });

// ==================== Model Export ====================
const BlogPost: Model<IBlogPost> =
    mongoose.models.BlogPost || mongoose.model<IBlogPost>("BlogPost", BlogPostSchema);

export default BlogPost;
