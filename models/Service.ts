import mongoose, { Schema, Document, Model } from "mongoose";

// ==================== Sub-Schemas ====================
interface ICloudinaryImage {
  url: string;
  public_id: string;
}

// ==================== Main Interface ====================
export interface IService extends Document {
  _id: mongoose.Types.ObjectId;
  merchant_id: mongoose.Types.ObjectId;
  name: string;
  price_min: number;
  price_max: number;
  duration_minutes: number;
  description?: string;
  image?: ICloudinaryImage;
  is_active: boolean;
  category: string;
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

const ServiceSchema = new Schema<IService>(
  {
    merchant_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Merchant ID is required"],
    },
    name: {
      type: String,
      required: [true, "Service name is required"],
      trim: true,
    },
    price_min: {
      type: Number,
      required: [true, "Minimum price is required"],
      min: 0,
    },
    price_max: {
      type: Number,
      required: [true, "Maximum price is required"],
      min: 0,
    },
    duration_minutes: {
      type: Number,
      required: [true, "Duration is required"],
      min: 1,
    },
    description: {
      type: String,
    },
    image: CloudinaryImageSchema,
    is_active: {
      type: Boolean,
      default: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["SPA", "MEDICAL", "VACCINATION", "DEWORMING", "PET_CARE"],
      default: "SPA",
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// ==================== Indexes ====================
ServiceSchema.index({ merchant_id: 1 });
ServiceSchema.index({ is_active: 1 });

// ==================== Model Export ====================
const Service: Model<IService> =
  mongoose.models.Service || mongoose.model<IService>("Service", ServiceSchema);

export default Service;
