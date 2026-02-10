import mongoose, { Schema, Document, Model } from "mongoose";

// ==================== Enums ====================
export enum TransactionStatus {
  PENDING = "PENDING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  EXPIRED = "EXPIRED",
}

export enum TransactionType {
  SUBSCRIPTION = "SUBSCRIPTION",
  ORDER = "ORDER",
  TOP_UP = "TOP_UP",
}

export enum PaymentMethodType {
  QR_BANK_TRANSFER = "QR_BANK_TRANSFER",
}

// ==================== Main Interface ====================
export interface ITransaction extends Document {
  _id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  type: TransactionType;
  reference_id?: mongoose.Types.ObjectId; // Package ID or Order ID
  amount: number;
  transaction_code: string; // Unique code for bank transfer content
  qr_code_url?: string;
  status: TransactionStatus;
  payment_method: PaymentMethodType;
  sepay_transaction_id?: string; // Transaction ID from SePay webhook
  expire_at: Date;
  paid_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// ==================== Schema Definition ====================
const TransactionSchema = new Schema<ITransaction>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    type: {
      type: String,
      enum: Object.values(TransactionType),
      required: [true, "Transaction type is required"],
    },
    reference_id: {
      type: Schema.Types.ObjectId,
      // Can reference Package or Order depending on type
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [1000, "Minimum amount is 1000 VND"],
    },
    transaction_code: {
      type: String,
      required: [true, "Transaction code is required"],
      unique: true,
      uppercase: true,
    },
    qr_code_url: {
      type: String,
    },
    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      default: TransactionStatus.PENDING,
    },
    payment_method: {
      type: String,
      enum: Object.values(PaymentMethodType),
      default: PaymentMethodType.QR_BANK_TRANSFER,
    },
    sepay_transaction_id: {
      type: String,
    },
    expire_at: {
      type: Date,
      required: [true, "Expire time is required"],
    },
    paid_at: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// ==================== Indexes ====================
TransactionSchema.index({ user_id: 1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ expire_at: 1 });
TransactionSchema.index({ created_at: -1 });

// ==================== Model Export ====================
const Transaction: Model<ITransaction> =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>("Transaction", TransactionSchema);

export default Transaction;
