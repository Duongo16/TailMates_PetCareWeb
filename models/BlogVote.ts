import mongoose, { Schema, Document, Model } from "mongoose";

// ==================== Enums ====================
export enum VoteType {
    LIKE = "LIKE",
    DISLIKE = "DISLIKE",
}

// ==================== Main Interface ====================
export interface IBlogVote extends Document {
    _id: mongoose.Types.ObjectId;
    blog_id: mongoose.Types.ObjectId;
    user_id: mongoose.Types.ObjectId;
    vote_type: VoteType;
    created_at: Date;
    updated_at: Date;
}

// ==================== Schema Definition ====================
const BlogVoteSchema = new Schema<IBlogVote>(
    {
        blog_id: {
            type: Schema.Types.ObjectId,
            ref: "BlogPost",
            required: [true, "Blog post is required"],
        },
        user_id: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User is required"],
        },
        vote_type: {
            type: String,
            enum: Object.values(VoteType),
            required: [true, "Vote type is required"],
        },
    },
    {
        timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    }
);

// ==================== Indexes ====================
// Unique compound index to prevent double voting
BlogVoteSchema.index({ blog_id: 1, user_id: 1 }, { unique: true });
BlogVoteSchema.index({ user_id: 1 });

// ==================== Model Export ====================
const BlogVote: Model<IBlogVote> =
    mongoose.models.BlogVote || mongoose.model<IBlogVote>("BlogVote", BlogVoteSchema);

export default BlogVote;
