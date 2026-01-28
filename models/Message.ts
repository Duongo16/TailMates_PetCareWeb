import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMessage extends Document {
    conversationId: mongoose.Types.ObjectId;
    senderId: mongoose.Types.ObjectId;
    content: string;
    media?: {
        url: string;
        type: "image" | "video";
        public_id?: string;
    }[];
    isRead: boolean;
    created_at: Date;
}

const MessageSchema = new Schema<IMessage>(
    {
        conversationId: {
            type: Schema.Types.ObjectId,
            ref: "Conversation",
            required: true,
        },
        senderId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        content: {
            type: String,
            required: function (this: any) {
                return !this.media || this.media.length === 0;
            },
        },
        media: [
            {
                url: String,
                type: { type: String, enum: ["image", "video"] },
                public_id: String,
            },
        ],
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: { createdAt: "created_at", updatedAt: false },
    }
);

// Indexes
MessageSchema.index({ conversationId: 1, created_at: -1 });

const Message: Model<IMessage> =
    mongoose.models.Message ||
    mongoose.model<IMessage>("Message", MessageSchema);

export default Message;
