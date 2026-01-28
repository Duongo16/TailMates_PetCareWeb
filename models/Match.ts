import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMatch extends Document {
    petA: mongoose.Types.ObjectId;
    petB: mongoose.Types.ObjectId;
    created_at: Date;
}

const MatchSchema = new Schema<IMatch>(
    {
        petA: {
            type: Schema.Types.ObjectId,
            ref: "Pet",
            required: true,
        },
        petB: {
            type: Schema.Types.ObjectId,
            ref: "Pet",
            required: true,
        },
    },
    {
        timestamps: { createdAt: "created_at", updatedAt: false },
    }
);

// Index for fast lookup and to prevent duplicate matches
// Ensure petA < petB to maintain consistency
MatchSchema.index({ petA: 1, petB: 1 }, { unique: true });

const Match: Model<IMatch> =
    mongoose.models.Match ||
    mongoose.model<IMatch>("Match", MatchSchema);

export default Match;
