import mongoose, { Schema, Document, Model } from "mongoose";

// ==================== Enums ====================
export enum ProductCategory {
  FOOD = "FOOD",
  TOY = "TOY",
  MEDICINE = "MEDICINE",
  ACCESSORY = "ACCESSORY",
  HYGIENE = "HYGIENE",
  OTHER = "OTHER",
}

// ==================== Sub-Schemas ====================
interface ICloudinaryImage {
  url: string;
  public_id: string;
}

// ==================== Main Interface ====================
export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId;
  merchant_id: mongoose.Types.ObjectId;
  name: string;
  category: ProductCategory;
  price: number;
  description?: string;
  images: ICloudinaryImage[];
  stock_quantity: number;
  ai_tags: string[];
  is_active: boolean;
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

const ProductSchema = new Schema<IProduct>(
  {
    merchant_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Merchant ID is required"],
    },
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: Object.values(ProductCategory),
      required: [true, "Category is required"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: 0,
    },
    description: {
      type: String,
    },
    images: [CloudinaryImageSchema],
    stock_quantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    ai_tags: [{ type: String }],
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
ProductSchema.index({ merchant_id: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ is_active: 1 });
ProductSchema.index({ ai_tags: 1 });
ProductSchema.index({ name: "text", description: "text" });

// ==================== Model Export ====================
const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);

export default Product;
