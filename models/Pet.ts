import mongoose, { Schema, Document, Model } from "mongoose";

// ==================== Enums ====================
export enum PetSpecies {
  DOG = "Dog",
  CAT = "Cat",
  RABBIT = "Rabbit",
  HAMSTER = "Hamster",
  BIRD = "Bird",
  OTHER = "Other",
}

export enum PetGender {
  MALE = "MALE",
  FEMALE = "FEMALE",
}

// ==================== Sub-Schemas ====================
interface ICloudinaryImage {
  url: string;
  public_id: string;
}

interface IAIAnalysis {
  personality?: string;
  dietary_advice?: string;
  care_tips?: string;
}

// ==================== Main Interface ====================
export interface IPet extends Document {
  _id: mongoose.Types.ObjectId;
  owner_id: mongoose.Types.ObjectId;
  name: string;
  species: string;
  breed?: string;
  age_months: number;
  weight_kg?: number;
  gender: PetGender;
  sterilized: boolean;
  color?: string;
  microchip?: string;
  allergies?: string[];
  notes?: string;
  image?: ICloudinaryImage;
  ai_analysis?: IAIAnalysis;
  created_at: Date;
}

// ==================== Schema Definition ====================
const CloudinaryImageSchema = new Schema<ICloudinaryImage>(
  {
    url: { type: String, required: true },
    public_id: { type: String, required: true },
  },
  { _id: false }
);

const AIAnalysisSchema = new Schema<IAIAnalysis>(
  {
    personality: { type: String },
    dietary_advice: { type: String },
    care_tips: { type: String },
  },
  { _id: false }
);

const PetSchema = new Schema<IPet>(
  {
    owner_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner is required"],
    },
    name: {
      type: String,
      required: [true, "Pet name is required"],
      trim: true,
    },
    species: {
      type: String,
      required: [true, "Species is required"],
    },
    breed: {
      type: String,
      trim: true,
    },
    age_months: {
      type: Number,
      required: [true, "Age is required"],
      min: 0,
    },
    weight_kg: {
      type: Number,
      min: 0,
    },
    gender: {
      type: String,
      enum: Object.values(PetGender),
      required: true,
    },
    sterilized: {
      type: Boolean,
      default: false,
    },
    color: {
      type: String,
      trim: true,
    },
    microchip: {
      type: String,
      trim: true,
    },
    allergies: [{
      type: String,
      trim: true,
    }],
    notes: {
      type: String,
      trim: true,
    },
    image: CloudinaryImageSchema,
    ai_analysis: AIAnalysisSchema,
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

// ==================== Indexes ====================
PetSchema.index({ owner_id: 1 });
PetSchema.index({ species: 1 });

// ==================== Model Export ====================
const Pet: Model<IPet> =
  mongoose.models.Pet || mongoose.model<IPet>("Pet", PetSchema);

export default Pet;
