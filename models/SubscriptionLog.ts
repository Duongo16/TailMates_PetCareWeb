import mongoose, { Schema, Document, Model } from "mongoose";

// ==================== Enums ====================
export enum SubscriptionLogStatus {
  PENDING = "PENDING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

// ==================== Main Interface ====================
export interface ISubscriptionLog extends Document {
  _id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  package_id: mongoose.Types.ObjectId;
  amount: number;
  payment_gateway_id?: string;
  status: SubscriptionLogStatus;
  created_at: Date;
}

// ==================== Schema Definition ====================
const SubscriptionLogSchema = new Schema<ISubscriptionLog>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    package_id: {
      type: Schema.Types.ObjectId,
      ref: "Package",
      required: [true, "Package ID is required"],
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    payment_gateway_id: {
      type: String,
    },
    status: {
      type: String,
      enum: Object.values(SubscriptionLogStatus),
      default: SubscriptionLogStatus.PENDING,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

// ==================== Indexes ====================
SubscriptionLogSchema.index({ user_id: 1 });
SubscriptionLogSchema.index({ package_id: 1 });
SubscriptionLogSchema.index({ status: 1 });
SubscriptionLogSchema.index({ created_at: -1 });

// ==================== Model Export ====================
const SubscriptionLog: Model<ISubscriptionLog> =
  mongoose.models.SubscriptionLog ||
  mongoose.model<ISubscriptionLog>("SubscriptionLog", SubscriptionLogSchema);

export default SubscriptionLog;
