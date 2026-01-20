import mongoose, { Schema, Document, Model } from "mongoose";

// ==================== Enums ====================
export enum NotificationType {
    ORDER_UPDATE = "ORDER_UPDATE",
    BOOKING_UPDATE = "BOOKING_UPDATE",
    MEDICAL_RECORD = "MEDICAL_RECORD",
    SUBSCRIPTION = "SUBSCRIPTION",
    SYSTEM = "SYSTEM",
}

// ==================== Interface ====================
export interface INotification extends Document {
    _id: mongoose.Types.ObjectId;
    user_id: mongoose.Types.ObjectId;
    type: NotificationType;
    title: string;
    message: string;
    is_read: boolean;
    redirect_url?: string;
    reference_id?: mongoose.Types.ObjectId;
    created_at: Date;
    updated_at: Date;
}

// ==================== Schema ====================
const NotificationSchema = new Schema<INotification>(
    {
        user_id: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User ID is required"],
            index: true,
        },
        type: {
            type: String,
            enum: Object.values(NotificationType),
            required: [true, "Notification type is required"],
        },
        title: {
            type: String,
            required: [true, "Title is required"],
            maxlength: 200,
        },
        message: {
            type: String,
            required: [true, "Message is required"],
            maxlength: 500,
        },
        is_read: {
            type: Boolean,
            default: false,
        },
        redirect_url: {
            type: String,
        },
        reference_id: {
            type: Schema.Types.ObjectId,
        },
    },
    {
        timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    }
);

// ==================== Indexes ====================
NotificationSchema.index({ user_id: 1, created_at: -1 });
NotificationSchema.index({ user_id: 1, is_read: 1 });

// ==================== Model Export ====================
const Notification: Model<INotification> =
    mongoose.models.Notification ||
    mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;
