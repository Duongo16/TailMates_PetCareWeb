import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Pet from "@/models/Pet";
import Product from "@/models/Product";
import Service from "@/models/Service";
import MedicalRecord from "@/models/MedicalRecord";
import { authenticate, apiResponse, extractToken, verifyToken } from "@/lib/auth";
import { generateAISuggestions, generateRuleBasedRecommendations } from "@/lib/openrouter";
import { AISuggestionInput } from "@/lib/types/ai-suggestions";

// Helper to check if analysis is outdated (> 30 days)
function isAnalysisOutdated(analyzedAt: Date | null | undefined): boolean {
    if (!analyzedAt) return false;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return new Date(analyzedAt) < thirtyDaysAgo;
}

function getDaysSinceAnalysis(analyzedAt: Date | null | undefined): number | undefined {
    if (!analyzedAt) return undefined;
    const now = new Date();
    const analyzed = new Date(analyzedAt);
    const diffTime = Math.abs(now.getTime() - analyzed.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// GET: Retrieve cached health analysis
export async function GET(request: NextRequest) {
    try {
        const token = extractToken(request);
        if (!token) {
            return NextResponse.json(
                { success: false, message: "Unauthorized - No token" },
                { status: 401 }
            );
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const petId = searchParams.get("petId");

        if (!petId) {
            return apiResponse.badRequest("Pet ID is required");
        }

        await connectDB();

        const pet = await Pet.findOne({ _id: petId, owner_id: decoded.userId });
        if (!pet) {
            return apiResponse.notFound("Pet not found");
        }

        const cachedAnalysis = pet.ai_analysis?.health_analysis;

        if (!cachedAnalysis) {
            return apiResponse.success({
                pet_id: pet._id.toString(),
                pet_name: pet.name,
                analysis: null,
                is_cached: false,
                is_outdated: false
            });
        }

        const analyzedAt = cachedAnalysis.analyzed_at;
        const isOutdated = isAnalysisOutdated(analyzedAt);
        const daysSince = getDaysSinceAnalysis(analyzedAt);

        return apiResponse.success({
            pet_id: pet._id.toString(),
            pet_name: pet.name,
            analysis: cachedAnalysis,
            is_cached: true,
            is_outdated: isOutdated,
            days_since_analysis: daysSince
        });
    } catch (error) {
        console.error("GET Health Analysis Error:", error);
        return apiResponse.serverError("Failed to fetch cached analysis");
    }
}


export async function POST(request: NextRequest) {
    try {
        const { user, error } = await authenticate(request);
        if (error) return error;

        const body = await request.json();
        const { petId, type = "all" } = body; // type: "food" | "service" | "all"

        if (!petId) {
            return apiResponse.error("Pet ID is required");
        }

        await connectDB();

        // 1. Fetch Pet data
        const pet = await Pet.findById(petId);
        if (!pet) {
            return apiResponse.notFound("Pet not found");
        }

        // Verify ownership
        if (pet.owner_id.toString() !== user!._id.toString()) {
            return apiResponse.forbidden("You don't have access to this pet");
        }

        // 2. Fetch Medical Records (last 5)
        const medicalRecords = await MedicalRecord.find({ pet_id: petId })
            .sort({ visit_date: -1 })
            .limit(5)
            .lean();

        // 3. Fetch available products (FOOD category only for food suggestions)
        const products = type !== "service"
            ? await Product.find({
                is_active: true,
                category: "FOOD",
                stock_quantity: { $gt: 0 }
            }).limit(20).lean()
            : [];

        // 4. Fetch available services
        const services = type !== "food"
            ? await Service.find({ is_active: true }).limit(15).lean()
            : [];

        // Build input for AI
        const aiInput: AISuggestionInput = {
            pet: {
                name: pet.name,
                species: pet.species,
                breed: pet.breed,
                age_months: pet.age_months,
                weight_kg: pet.weight_kg,
                gender: pet.gender,
                sterilized: pet.sterilized,
                allergies: pet.allergies || [],
                notes: pet.notes,
            },
            medicalRecords: medicalRecords.map(r => ({
                type: r.record_type,
                diagnosis: r.diagnosis,
                treatment: r.treatment,
                vaccines: r.vaccines,
                visit_date: r.visit_date,
            })),
            products: products.map(p => ({
                id: (p._id as { toString(): string }).toString(),
                name: p.name,
                category: p.category,
                price: p.price,
                sale_price: p.sale_price,
                image: p.images?.[0]?.url,
                specifications: p.specifications,
            })),
            services: services.map(s => ({
                id: (s._id as { toString(): string }).toString(),
                name: s.name,
                category: s.category,
                price_min: s.price_min,
                price_max: s.price_max,
                image: s.image?.url,
            })),
        };

        let aiResponse;
        let isFallback = false;

        try {
            // 5. Call OpenRouter AI
            aiResponse = await generateAISuggestions(aiInput);
        } catch (aiError) {
            console.error("AI Suggestions error, falling back to rule-based:", aiError);

            // Fallback to rule-based recommendations
            aiResponse = generateRuleBasedRecommendations(
                aiInput.pet,
                aiInput.products,
                aiInput.services
            );
            isFallback = true;
        }

        // 6. Save health analysis to Pet document for caching
        const now = new Date();
        const healthAnalysis = {
            health_summary: aiResponse.analysis?.health_summary || "",
            weight_status: aiResponse.analysis?.weight_status || "",
            activity_level: aiResponse.analysis?.activity_level || "",
            nutritional_needs: aiResponse.analysis?.nutritional_needs || {},
            health_indices: aiResponse.analysis?.health_indices || [],
            food_recommendations: aiResponse.food_recommendations || [],
            service_recommendations: aiResponse.service_recommendations || [],
            analyzed_at: now
        };

        await Pet.findByIdAndUpdate(petId, {
            $set: {
                "ai_analysis.health_analysis": healthAnalysis
            }
        });

        return apiResponse.success({
            pet_id: petId,
            pet_name: pet.name,
            ...aiResponse,
            generated_at: now.toISOString(),
            is_fallback: isFallback,
            fallback_reason: isFallback ? "AI service temporarily unavailable" : undefined,
        });

    } catch (error) {
        console.error("AI Suggestions API error:", error);
        return apiResponse.serverError("Failed to generate suggestions");
    }
}
