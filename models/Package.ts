import mongoose, { Schema, Document, Model } from "mongoose";
import { UserRole } from "./User";

// ==================== Sub-Schemas ====================
interface IFeaturesConfig {
  ai_limit_per_day: number;
  max_pets: number;
  priority_support: boolean;
  unlimited_products?: boolean;
  qr_scanning?: boolean;
  advanced_analytics?: boolean;
}

// ==================== Main Interface ====================
export interface IPackage extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  target_role: UserRole;
  price: number;
  duration_months: number;
  description?: string;
  features_config: IFeaturesConfig;
  commission_rate: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// ==================== Schema Definition ====================
const FeaturesConfigSchema = new Schema<IFeaturesConfig>(
  {
    ai_limit_per_day: { type: Number, default: 5 },
    max_pets: { type: Number, default: 1 },
    priority_support: { type: Boolean, default: false },
    unlimited_products: { type: Boolean, default: false },
    qr_scanning: { type: Boolean, default: false },
    advanced_analytics: { type: Boolean, default: false },
  },
  { _id: false }
);

const PackageSchema = new Schema<IPackage>(
  {
    name: {
      type: String,
      required: [true, "Package name is required"],
      trim: true,
    },
    target_role: {
      type: String,
      enum: [UserRole.CUSTOMER, UserRole.MERCHANT],
      required: [true, "Target role is required"],
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    duration_months: {
      type: Number,
      required: true,
      min: 1,
    },
    description: {
      type: String,
    },
    features_config: {
      type: FeaturesConfigSchema,
      required: true,
    },
    commission_rate: {
      type: Number,
      default: 0.1, // 10%
      min: 0,
      max: 1,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// ==================== Indexes ====================
PackageSchema.index({ target_role: 1 });
PackageSchema.index({ is_active: 1 });

// ==================== Model Export ====================
const Package: Model<IPackage> =
  mongoose.models.Package || mongoose.model<IPackage>("Package", PackageSchema);

export default Package;
