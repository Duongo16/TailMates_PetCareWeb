import mongoose, { Schema, Document, Model } from "mongoose";

// ==================== Main Interface ====================
export interface IAIConsultation extends Document {
  _id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  pet_id: mongoose.Types.ObjectId;
  symptoms_input: string;
  ai_response: string;
  created_at: Date;
}

// ==================== Schema Definition ====================
const AIConsultationSchema = new Schema<IAIConsultation>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    pet_id: {
      type: Schema.Types.ObjectId,
      ref: "Pet",
      required: [true, "Pet ID is required"],
    },
    symptoms_input: {
      type: String,
      required: [true, "Symptoms input is required"],
    },
    ai_response: {
      type: String,
      required: [true, "AI response is required"],
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

// ==================== Indexes ====================
AIConsultationSchema.index({ user_id: 1 });
AIConsultationSchema.index({ pet_id: 1 });
AIConsultationSchema.index({ created_at: -1 });

// ==================== Model Export ====================
const AIConsultation: Model<IAIConsultation> =
  mongoose.models.AIConsultation ||
  mongoose.model<IAIConsultation>("AIConsultation", AIConsultationSchema);

export default AIConsultation;
