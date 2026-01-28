import mongoose, { Schema, Document, Model } from "mongoose";

export enum ConversationType {
    PAWMATCH = "PAWMATCH",
    COMMERCE = "COMMERCE",
    CONSULTATION = "CONSULTATION",
}

export interface IConversation extends Document {
    participants: mongoose.Types.ObjectId[];
    type: ConversationType;
    contextId?: mongoose.Types.ObjectId; // Reference to Pet, Order, or AIConsultation
    lastMessage?: mongoose.Types.ObjectId;
    unreadCount: Map<string, number>;
    metadata?: {
        title?: string;
        image?: string;
    };
    created_at: Date;
    updated_at: Date;
}

const ConversationSchema = new Schema<IConversation>(
    {
        participants: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
        ],
        type: {
            type: String,
            enum: Object.values(ConversationType),
            required: true,
        },
        contextId: {
            type: Schema.Types.ObjectId,
            required: false,
        },
        lastMessage: {
            type: Schema.Types.ObjectId,
            ref: "Message",
        },
        unreadCount: {
            type: Map,
            of: Number,
            default: new Map(),
        },
        metadata: {
            title: String,
            image: String,
        },
    },
    {
        timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    }
);

// Index for fast lookup of a user's conversations
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ type: 1 });
ConversationSchema.index({ updated_at: -1 });

const Conversation: Model<IConversation> =
    mongoose.models.Conversation ||
    mongoose.model<IConversation>("Conversation", ConversationSchema);

export default Conversation;
