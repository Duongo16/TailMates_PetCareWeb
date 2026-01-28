import mongoose, { Schema, Document, Model } from "mongoose";

// ==================== Enums ====================
export enum TermsType {
    TERMS = "terms",
    PRIVACY = "privacy",
}

// ==================== Main Interface ====================
export interface ITermsAndPolicies extends Document {
    _id: mongoose.Types.ObjectId;
    title: string;
    content: string;
    version: string;
    type: TermsType;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

// ==================== Schema Definition ====================
const TermsAndPoliciesSchema = new Schema<ITermsAndPolicies>(
    {
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
        },
        content: {
            type: String,
            required: [true, "Content is required"],
        },
        version: {
            type: String,
            required: [true, "Version is required"],
            trim: true,
        },
        type: {
            type: String,
            enum: Object.values(TermsType),
            required: [true, "Type is required"],
        },
        is_active: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    }
);

// ==================== Indexes ====================
TermsAndPoliciesSchema.index({ type: 1, is_active: 1 });
TermsAndPoliciesSchema.index({ created_at: -1 });

// ==================== Model Export ====================
const TermsAndPolicies: Model<ITermsAndPolicies> =
    mongoose.models.TermsAndPolicies ||
    mongoose.model<ITermsAndPolicies>("TermsAndPolicies", TermsAndPoliciesSchema);

export default TermsAndPolicies;
