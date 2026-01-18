// Product-related constants and types that can be used in both server and client
// This file does NOT import mongoose, so it's safe for client components

export enum TargetSpecies {
    DOG = "DOG",
    CAT = "CAT",
}

export enum LifeStage {
    KITTEN_PUPPY = "KITTEN_PUPPY",
    ADULT = "ADULT",
    SENIOR = "SENIOR",
    ALL_STAGES = "ALL_STAGES",
}

export enum BreedSize {
    SMALL = "SMALL",
    MEDIUM = "MEDIUM",
    LARGE = "LARGE",
    GIANT = "GIANT",
    ALL_SIZES = "ALL_SIZES",
}

export enum ProductCategory {
    FOOD = "FOOD",
    TOY = "TOY",
    MEDICINE = "MEDICINE",
    ACCESSORY = "ACCESSORY",
    HYGIENE = "HYGIENE",
    OTHER = "OTHER",
}

// Predefined Health Tags for consistency
export const HEALTH_TAGS = [
    "Hairball Control",
    "Weight Management",
    "Skin & Coat",
    "Kidney Support",
    "Digestive Health",
    "Joint Support",
    "Dental Care",
    "Immune Support",
    "Sensitive Stomach",
    "High Energy",
    "Low Fat",
    "Grain Free",
] as const;

export type HealthTag = (typeof HEALTH_TAGS)[number];

export interface INutritionalInfo {
    protein?: number;    // %
    fat?: number;        // %
    fiber?: number;      // %
    moisture?: number;   // %
    calories?: number;   // kcal/kg
}

export interface IProductSpecifications {
    targetSpecies?: TargetSpecies;
    lifeStage?: LifeStage;
    breedSize?: BreedSize;
    healthTags?: string[];
    nutritionalInfo?: INutritionalInfo;
    ingredients?: string[];
    isSterilized?: boolean;
}
