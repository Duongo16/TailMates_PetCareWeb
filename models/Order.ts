import mongoose, { Schema, Document, Model } from "mongoose";

// ==================== Enums ====================
export enum OrderStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  SHIPPING = "SHIPPING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum PaymentMethod {
  COD = "COD",
  VN_PAY = "VN_PAY",
  MOMO = "MOMO",
  BANK_TRANSFER = "BANK_TRANSFER",
}

// ==================== Sub-Schemas ====================
interface IOrderItem {
  product_id: mongoose.Types.ObjectId;
  name: string; // Snapshot
  price: number; // Snapshot
  product_image?: string; // Snapshot - product image URL
  quantity: number;
}

// ==================== Main Interface ====================
export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId;
  customer_id: mongoose.Types.ObjectId;
  merchant_id: mongoose.Types.ObjectId;
  items: IOrderItem[];
  total_amount: number;
  payment_method: PaymentMethod;
  status: OrderStatus;
  shipping_address?: string;
  note?: string;
  created_at: Date;
  updated_at: Date;
}

// ==================== Schema Definition ====================
const OrderItemSchema = new Schema<IOrderItem>(
  {
    product_id: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    product_image: { type: String }, // Optional product image URL snapshot
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    customer_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer ID is required"],
    },
    merchant_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Merchant ID is required"],
    },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: {
        validator: (v: IOrderItem[]) => v.length > 0,
        message: "Order must have at least one item",
      },
    },
    total_amount: {
      type: Number,
      required: true,
      min: 0,
    },
    payment_method: {
      type: String,
      enum: Object.values(PaymentMethod),
      default: PaymentMethod.COD,
    },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
    },
    shipping_address: {
      type: String,
    },
    note: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// ==================== Indexes ====================
OrderSchema.index({ customer_id: 1 });
OrderSchema.index({ merchant_id: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ created_at: -1 });

// ==================== Model Export ====================
const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
