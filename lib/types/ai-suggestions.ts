// AI Suggestions Types for TailMates

export interface PetHealthIndex {
    label: string;           // VD: "Nhu cầu Protein"
    value: number;           // 0-100
    status: "low" | "medium" | "high";
    reason: string;          // VD: "Mèo đang trong giai đoạn phát triển"
    icon?: string;           // VD: "protein", "heart", "bone"
}

export interface NutritionalNeeds {
    protein: "HIGH" | "MEDIUM" | "LOW";
    fat: "HIGH" | "MEDIUM" | "LOW";
    fiber: "HIGH" | "MEDIUM" | "LOW";
    specialDiet: string | null;     // VD: "Grain-free", "Low-sodium"
    avoidIngredients: string[];     // VD: ["Chicken", "Wheat"]
}

export interface MatchMetrics {
    species_match: number;          // 0-100
    life_stage_fit: number;         // 0-100
    allergy_safety: number;         // 0-100
    health_tag_match: number;       // 0-100
    nutritional_balance: number;    // 0-100
}

export interface FoodRecommendation {
    product_id: string;
    product_name: string;
    product_image?: string;
    match_point: number;            // 0-100 overall score
    metrics: MatchMetrics;
    reasoning: string;              // Vietnamese explanation
    price: number;
    sale_price?: number;
}

export interface ServiceRecommendation {
    service_id: string;
    service_name: string;
    service_image?: string;
    match_point: number;
    urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    urgency_reason: string;
    reasoning: string;
    price_range: { min: number; max: number };
    recommended_date?: string;      // ISO date if applicable
}

export interface PetAnalysis {
    health_summary: string;       // Vietnamese summary
    weight_status: "UNDERWEIGHT" | "NORMAL" | "OVERWEIGHT";
    activity_level: "LOW" | "MODERATE" | "HIGH";
    nutritional_needs: NutritionalNeeds;
    health_indices: PetHealthIndex[];
}

export interface AISuggestionResponse {
    pet_id: string;
    pet_name: string;
    analysis: PetAnalysis;
    food_recommendations: FoodRecommendation[];
    service_recommendations: ServiceRecommendation[];
    generated_at: string;           // ISO timestamp
    is_fallback?: boolean;
    fallback_reason?: string;
}

// Input types for OpenRouter
export interface PetInput {
    name: string;
    species: string;
    breed?: string;
    age_months: number;
    weight_kg?: number;
    gender: string;
    sterilized: boolean;
    allergies: string[];
    notes?: string;
}

export interface MedicalRecordInput {
    type: string;
    diagnosis: string;
    treatment?: string;
    vaccines?: string[];
    visit_date: Date;
}

export interface ProductInput {
    id: string;
    name: string;
    category: string;
    price: number;
    sale_price?: number;
    image?: string;
    specifications?: {
        targetSpecies?: string;
        lifeStage?: string;
        breedSize?: string;
        healthTags?: string[];
        nutritionalInfo?: {
            protein?: number;
            fat?: number;
            fiber?: number;
            moisture?: number;
            calories?: number;
        };
        ingredients?: string[];
        isSterilized?: boolean;
        texture?: string;
        primaryProteinSource?: string;
    };
}

export interface ServiceInput {
    id: string;
    name: string;
    category: string;
    price_min: number;
    price_max: number;
    image?: string;
}

export interface AISuggestionInput {
    pet: PetInput;
    medicalRecords: MedicalRecordInput[];
    products: ProductInput[];
    services: ServiceInput[];
}

// ==================== Personality Analysis Types ====================

export interface BreedSpecs {
    appearance: string[];
    temperament: string[];
    exercise_minutes_per_day: number;
    shedding_level: "LOW" | "MEDIUM" | "HIGH";
    grooming_needs: string;
}

export interface CareGuide {
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

export interface HealthWarnings {
    genetic_diseases: string[];
    dangerous_foods: string[];
    environment_hazards: string[];
}

export interface PersonalityAnalysisResult {
    type: string;                    // "Kẻ tinh nghịch năng động"
    traits: string[];                // ["Hiếu động", "Thích khám phá"]
    behavior_explanation: string;
    breed_specs: BreedSpecs;
    care_guide: CareGuide;
    warnings: HealthWarnings;
    analyzed_at: string;            // ISO timestamp
}

export interface PersonalityAnalysisResponse {
    pet_id: string;
    pet_name: string;
    analysis: PersonalityAnalysisResult;
    is_cached: boolean;
    is_outdated: boolean;           // > 30 days since last analysis
    days_since_analysis?: number;
}

export interface HealthAnalysisCached {
    health_summary: string;
    weight_status: string;
    activity_level: string;
    nutritional_needs: NutritionalNeeds;
    health_indices: PetHealthIndex[];
    food_recommendations: FoodRecommendation[];
    service_recommendations: ServiceRecommendation[];
    analyzed_at: string;
}

