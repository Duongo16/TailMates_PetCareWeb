import mongoose, { Schema, Document, Model } from "mongoose";

// ==================== Enums ====================
export enum BookingStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

// ==================== Main Interface ====================
export interface IBooking extends Document {
  _id: mongoose.Types.ObjectId;
  customer_id: mongoose.Types.ObjectId;
  merchant_id: mongoose.Types.ObjectId;
  service_id: mongoose.Types.ObjectId;
  pet_id: mongoose.Types.ObjectId;
  booking_time: Date;
  status: BookingStatus;
  note?: string;
  created_at: Date;
  updated_at: Date;
}

// ==================== Schema Definition ====================
const BookingSchema = new Schema<IBooking>(
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
    service_id: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: [true, "Service ID is required"],
    },
    pet_id: {
      type: Schema.Types.ObjectId,
      ref: "Pet",
      required: [true, "Pet ID is required"],
    },
    booking_time: {
      type: Date,
      required: [true, "Booking time is required"],
    },
    status: {
      type: String,
      enum: Object.values(BookingStatus),
      default: BookingStatus.PENDING,
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
BookingSchema.index({ customer_id: 1 });
BookingSchema.index({ merchant_id: 1 });
BookingSchema.index({ pet_id: 1 });
BookingSchema.index({ booking_time: 1 });
BookingSchema.index({ status: 1 });

// ==================== Model Export ====================
const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>("Booking", BookingSchema);

export default Booking;
