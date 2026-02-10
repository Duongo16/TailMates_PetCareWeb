import mongoose, { Schema, Document, Model } from "mongoose";

// ==================== Enums ====================
export enum UserRole {
  CUSTOMER = "CUSTOMER",
  MERCHANT = "MERCHANT",
  MANAGER = "MANAGER",
  ADMIN = "ADMIN",
}

export enum AuthProvider {
  EMAIL = "EMAIL",
  GOOGLE = "GOOGLE",
}

// ==================== Sub-Schemas (Embedded) ====================
interface ICloudinaryImage {
  url: string;
  public_id: string;
}

interface ISubscription {
  package_id?: mongoose.Types.ObjectId;
  started_at?: Date;
  expired_at?: Date;
  features: string[];
}

interface IMerchantProfile {
  shop_name: string;
  address: string;
  description?: string;
  rating: number;
  revenue_stats: number;
  website?: string;
  banners?: ICloudinaryImage[];
  categories?: string[];
  working_hours?: string;
  social_links?: {
    facebook?: string;
    instagram?: string;
    zalo?: string;
  };
}

// ==================== Main Interface ====================
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password?: string; // Optional for Google OAuth users
  full_name: string;
  phone_number?: string;
  role: UserRole;
  avatar?: ICloudinaryImage;
  is_active: boolean;
  subscription?: ISubscription;
  merchant_profile?: IMerchantProfile;
  // Authentication fields
  auth_provider: AuthProvider;
  google_id?: string;
  is_email_verified: boolean;
  refresh_token_version: number;
  tm_balance: number; // Virtual currency (1000 TM = 1000 VND)
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

const SubscriptionSchema = new Schema<ISubscription>(
  {
    package_id: { type: Schema.Types.ObjectId, ref: "Package" },
    started_at: { type: Date },
    expired_at: { type: Date },
    features: [{ type: String }],
  },
  { _id: false }
);

const MerchantProfileSchema = new Schema<IMerchantProfile>(
  {
    shop_name: {
      type: String,
      required: function (this: any) {
        // Special case for subdocument validation in Mongoose
        // When validating the parent User, we want this required IF role is MERCHANT
        const parent = this.parent ? this.parent() : this;
        return parent?.role === UserRole.MERCHANT;
      },
    },
    address: {
      type: String,
      required: function (this: any) {
        const parent = this.parent ? this.parent() : this;
        return parent?.role === UserRole.MERCHANT;
      },
    },
    description: { type: String },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    revenue_stats: { type: Number, default: 0 },
    website: { type: String },
    banners: [CloudinaryImageSchema],
    categories: [{ type: String }],
    working_hours: { type: String },
    social_links: {
      facebook: { type: String },
      instagram: { type: String },
      zalo: { type: String },
    },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      // Password is optional for Google OAuth users
      minlength: [6, "Password must be at least 6 characters"],
    },
    full_name: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    phone_number: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.CUSTOMER,
    },
    avatar: CloudinaryImageSchema,
    is_active: {
      type: Boolean,
      default: true,
    },
    subscription: SubscriptionSchema,
    merchant_profile: MerchantProfileSchema,
    // Authentication fields
    auth_provider: {
      type: String,
      enum: Object.values(AuthProvider),
      default: AuthProvider.EMAIL,
    },
    google_id: {
      type: String,
    },
    is_email_verified: {
      type: Boolean,
      default: false,
    },
    refresh_token_version: {
      type: Number,
      default: 0,
    },
    tm_balance: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// ==================== Indexes ====================
// Note: email index is automatically created by unique: true
UserSchema.index({ role: 1 });
UserSchema.index({ is_active: 1 });
UserSchema.index({ google_id: 1 }, { sparse: true });

// ==================== Model Export ====================
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
