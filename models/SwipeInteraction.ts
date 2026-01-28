import mongoose, { Schema, Document, Model } from "mongoose";

export enum SwipeAction {
    LIKE = "LIKE",
    PASS = "PASS",
}

export interface ISwipeInteraction extends Document {
    actorPetId: mongoose.Types.ObjectId;
    targetPetId: mongoose.Types.ObjectId;
    action: SwipeAction;
    created_at: Date;
}

const SwipeInteractionSchema = new Schema<ISwipeInteraction>(
    {
        actorPetId: {
            type: Schema.Types.ObjectId,
            ref: "Pet",
            required: true,
        },
        targetPetId: {
            type: Schema.Types.ObjectId,
            ref: "Pet",
            required: true,
        },
        action: {
            type: String,
            enum: Object.values(SwipeAction),
            required: true,
        },
    },
    {
        timestamps: { createdAt: "created_at", updatedAt: false },
    }
);

// Indexes for fast lookup
SwipeInteractionSchema.index({ actorPetId: 1, targetPetId: 1 }, { unique: true });
SwipeInteractionSchema.index({ actorPetId: 1, action: 1 });

const SwipeInteraction: Model<ISwipeInteraction> =
    mongoose.models.SwipeInteraction ||
    mongoose.model<ISwipeInteraction>("SwipeInteraction", SwipeInteractionSchema);

export default SwipeInteraction;
