import mongoose, { Schema, Document, Model } from "mongoose";
import {
  ProductCategory,
  TargetSpecies,
  LifeStage,
  BreedSize,
  HEALTH_TAGS,
  IProductSpecifications,
  INutritionalInfo,
  Texture,
  PrimaryProteinSource,
} from "@/lib/product-constants";

// Re-export for backward compatibility with server-side imports
export {
  ProductCategory,
  TargetSpecies,
  LifeStage,
  BreedSize,
  HEALTH_TAGS,
  Texture,
  PrimaryProteinSource,
  type IProductSpecifications,
};

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
  sale_price?: number;
  description?: string;
  images: ICloudinaryImage[];
  stock_quantity: number;
  ai_tags: string[];
  is_active: boolean;
  specifications?: IProductSpecifications;
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

const NutritionalInfoSchema = new Schema<INutritionalInfo>(
  {
    protein: { type: Number, min: 0, max: 100 },
    fat: { type: Number, min: 0, max: 100 },
    fiber: { type: Number, min: 0, max: 100 },
    moisture: { type: Number, min: 0, max: 100 },
    calories: { type: Number, min: 0 },
    calcium: { type: Number, min: 0 },
    phosphorus: { type: Number, min: 0 },
    taurine: { type: Number, min: 0 },
  },
  { _id: false }
);

const ProductSpecificationsSchema = new Schema<IProductSpecifications>(
  {
    targetSpecies: {
      type: String,
      enum: Object.values(TargetSpecies),
    },
    lifeStage: {
      type: String,
      enum: Object.values(LifeStage),
    },
    breedSize: {
      type: String,
      enum: Object.values(BreedSize),
    },
    healthTags: [{ type: String }],
    nutritionalInfo: NutritionalInfoSchema,
    ingredients: [{ type: String }],
    isSterilized: { type: Boolean },

    // New fields
    caloricDensity: {
      amount: { type: Number },
      unit: { type: String },
    },
    texture: {
      type: String,
      enum: Object.values(Texture),
    },
    primaryProteinSource: {
      type: String,
      enum: Object.values(PrimaryProteinSource),
    },
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
    sale_price: {
      type: Number,
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
    specifications: ProductSpecificationsSchema,
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
// Indexes for specifications filtering
ProductSchema.index({ "specifications.targetSpecies": 1 });
ProductSchema.index({ "specifications.lifeStage": 1 });
ProductSchema.index({ "specifications.breedSize": 1 });
ProductSchema.index({ "specifications.healthTags": 1 });
ProductSchema.index({ "specifications.isSterilized": 1 });

// ==================== Model Export ====================
const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);

export default Product;
