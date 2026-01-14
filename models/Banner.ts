import mongoose, { Schema, Document, Model } from "mongoose";

// ==================== Enums ====================
export enum BannerLocation {
    HOME = "HOME",
    SHOP = "SHOP",
    SERVICE = "SERVICE",
    PROFILE = "PROFILE",
    ALL = "ALL",
}

// ==================== Sub-Schemas ====================
interface ICloudinaryImage {
    url: string;
    public_id: string;
}

// ==================== Main Interface ====================
export interface IBanner extends Document {
    _id: mongoose.Types.ObjectId;
    image: ICloudinaryImage;
    targetUrl?: string;
    priority: number;
    isActive: boolean;
    displayLocation: BannerLocation;
    title?: string;
    createdBy: mongoose.Types.ObjectId;
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

const BannerSchema = new Schema<IBanner>(
    {
        image: {
            type: CloudinaryImageSchema,
            required: [true, "Banner image is required"],
        },
        targetUrl: {
            type: String,
            trim: true,
        },
        priority: {
            type: Number,
            default: 0,
            min: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        displayLocation: {
            type: String,
            enum: Object.values(BannerLocation),
            default: BannerLocation.ALL,
        },
        title: {
            type: String,
            trim: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Creator is required"],
        },
    },
    {
        timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    }
);

// ==================== Indexes ====================
BannerSchema.index({ isActive: 1, displayLocation: 1 });
BannerSchema.index({ priority: 1 });

// ==================== Model Export ====================
const Banner: Model<IBanner> =
    mongoose.models.Banner || mongoose.model<IBanner>("Banner", BannerSchema);

export default Banner;
