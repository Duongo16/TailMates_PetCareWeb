import mongoose, { Schema, Document, Model } from "mongoose";

// ==================== Enums ====================
export enum PetSpecies {
  DOG = "Dog",
  CAT = "Cat",
  RABBIT = "Rabbit",
  HAMSTER = "Hamster",
  BIRD = "Bird",
  FISH = "Fish",
  OTHER = "Other",
}

export enum PetGender {
  MALE = "MALE",
  FEMALE = "FEMALE",
}

// ==================== Sub-Schemas ====================
interface ICloudinaryImage {
  url: string;
  public_id?: string;
  type?: "image" | "video";
}

// Personality Analysis Sub-Interfaces
interface IBreedSpecs {
  appearance: string[];
  temperament: string[];
  exercise_minutes_per_day: number;
  shedding_level: "LOW" | "MEDIUM" | "HIGH";
  grooming_needs: string;
}

interface ICareGuide {
  nutrition: {
    meals_per_day: number;
    food_type: string;
    tips: string[];
  };
  medical: {
    vaccines: string[];
    notes: string[];
  };
  training: {
    command: string;
    tips: string[];
  };
}

interface IHealthWarnings {
  genetic_diseases: string[];
  dangerous_foods: string[];
  environment_hazards: string[];
}

interface IPersonalityAnalysis {
  type: string;                    // "Kẻ tinh nghịch năng động"
  traits: string[];                // ["Hiếu động", "Thích khám phá"]
  behavior_explanation: string;
  breed_specs: IBreedSpecs;
  care_guide: ICareGuide;
  warnings: IHealthWarnings;
  analyzed_at: Date;
}

interface IHealthAnalysis {
  health_summary: string;
  weight_status: string;
  activity_level: string;
  nutritional_needs: {
    protein: string;
    fat: string;
    fiber: string;
    specialDiet: string | null;
    avoidIngredients: string[];
  };
  health_indices: Array<{
    label: string;
    value: number;
    status: string;
    reason: string;
    icon?: string;
  }>;
  food_recommendations: any[];
  service_recommendations: any[];
  analyzed_at: Date;
}

interface IAIAnalysis {
  // Legacy fields (kept for backward compatibility)
  personality?: string;
  dietary_advice?: string;
  care_tips?: string;
  // New detailed analysis fields
  personality_analysis?: IPersonalityAnalysis;
  health_analysis?: IHealthAnalysis;
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
  fur_type?: string;
  microchip?: string;
  allergies?: string[];
  notes?: string;
  image?: ICloudinaryImage;
  mediaGallery?: ICloudinaryImage[];
  datingProfile?: {
    bio?: string;
    lookingFor?: "Playdate" | "Breeding" | "Any";
  };
  ai_analysis?: IAIAnalysis;
  created_at: Date;
}

// ==================== Schema Definition ====================
const CloudinaryImageSchema = new Schema<ICloudinaryImage>(
  {
    url: { type: String, required: true },
    public_id: { type: String },
    type: { type: String, enum: ["image", "video"], default: "image" },
  },
  { _id: false }
);

const AIAnalysisSchema = new Schema<IAIAnalysis>(
  {
    // Legacy fields (kept for backward compatibility)
    personality: { type: String },
    dietary_advice: { type: String },
    care_tips: { type: String },
    // New detailed personality analysis
    personality_analysis: {
      type: { type: String },
      traits: [{ type: String }],
      behavior_explanation: { type: String },
      breed_specs: {
        appearance: [{ type: String }],
        temperament: [{ type: String }],
        exercise_minutes_per_day: { type: Number },
        shedding_level: { type: String, enum: ["LOW", "MEDIUM", "HIGH"] },
        grooming_needs: { type: String },
      },
      care_guide: {
        nutrition: {
          meals_per_day: { type: Number },
          food_type: { type: String },
          tips: [{ type: String }],
        },
        medical: {
          vaccines: [{ type: String }],
          notes: [{ type: String }],
        },
        training: {
          command: { type: String },
          tips: [{ type: String }],
        },
      },
      warnings: {
        genetic_diseases: [{ type: String }],
        dangerous_foods: [{ type: String }],
        environment_hazards: [{ type: String }],
      },
      analyzed_at: { type: Date },
    },
    // New detailed health analysis
    health_analysis: {
      health_summary: { type: String },
      weight_status: { type: String },
      activity_level: { type: String },
      nutritional_needs: {
        protein: { type: String },
        fat: { type: String },
        fiber: { type: String },
        specialDiet: { type: String },
        avoidIngredients: [{ type: String }],
      },
      health_indices: [{
        label: { type: String },
        value: { type: Number },
        status: { type: String },
        reason: { type: String },
        icon: { type: String },
      }],
      food_recommendations: [{ type: Schema.Types.Mixed }],
      service_recommendations: [{ type: Schema.Types.Mixed }],
      analyzed_at: { type: Date },
    },
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
    fur_type: {
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
    mediaGallery: {
      type: [CloudinaryImageSchema],
      validate: [
        {
          validator: (val: any[]) => val.length <= 10,
          message: "Media gallery cannot exceed 10 items",
        },
      ],
    },
    datingProfile: {
      bio: { type: String, trim: true, maxlength: 500 },
      lookingFor: {
        type: String,
        enum: ["Playdate", "Breeding", "Any"],
        default: "Any",
      },
    },
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

