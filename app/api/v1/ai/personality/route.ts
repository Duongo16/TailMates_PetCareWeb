import { NextRequest, NextResponse } from "next/server";
import { verifyToken, extractToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Pet from "@/models/Pet";
import User from "@/models/User";
import MedicalRecord from "@/models/MedicalRecord";
import { generatePersonalityAnalysis, generateRuleBasedPersonality } from "@/lib/openrouter";
import { checkFeatureAccess } from "@/lib/subscription-guard";

// Helper to check if analysis is outdated (> 30 days)
function isAnalysisOutdated(analyzedAt: Date | null | undefined): boolean {
    if (!analyzedAt) return false; // No previous analysis
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

// GET: Retrieve cached personality analysis
export async function GET(req: NextRequest) {
    try {
        const token = extractToken(req);
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

        const { searchParams } = new URL(req.url);
        const petId = searchParams.get("petId");

        if (!petId) {
            return NextResponse.json(
                { success: false, message: "Pet ID is required" },
                { status: 400 }
            );
        }

        await connectDB();

        const pet = await Pet.findOne({ _id: petId, owner_id: decoded.userId });
        if (!pet) {
            return NextResponse.json(
                { success: false, message: "Pet not found" },
                { status: 404 }
            );
        }

        const cachedAnalysis = pet.ai_analysis?.personality_analysis;

        if (!cachedAnalysis) {
            return NextResponse.json({
                success: true,
                data: {
                    pet_id: pet._id.toString(),
                    pet_name: pet.name,
                    analysis: null,
                    is_cached: false,
                    is_outdated: false
                }
            });
        }

        const analyzedAt = cachedAnalysis.analyzed_at;
        const isOutdated = isAnalysisOutdated(analyzedAt);
        const daysSince = getDaysSinceAnalysis(analyzedAt);

        return NextResponse.json({
            success: true,
            data: {
                pet_id: pet._id.toString(),
                pet_name: pet.name,
                analysis: cachedAnalysis,
                is_cached: true,
                is_outdated: isOutdated,
                days_since_analysis: daysSince
            }
        });
    } catch (error) {
        console.error("[Personality API] GET Error:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST: Generate new personality analysis
export async function POST(req: NextRequest) {
    try {
        const token = extractToken(req);
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

        const body = await req.json();
        const { petId } = body;

        if (!petId) {
            return NextResponse.json(
                { success: false, message: "Pet ID is required" },
                { status: 400 }
            );
        }

        await connectDB();

        // Check ai_personality feature from subscription
        const userDoc = await User.findById(decoded.userId);
        if (!userDoc) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }
        const featureCheck = await checkFeatureAccess(userDoc, "ai_personality");
        if (!featureCheck.allowed) {
            return NextResponse.json(
                { success: false, message: featureCheck.reason },
                { status: 403 }
            );
        }

        const pet = await Pet.findOne({ _id: petId, owner_id: decoded.userId });
        if (!pet) {
            return NextResponse.json(
                { success: false, message: "Pet not found" },
                { status: 404 }
            );
        }

        // Fetch medical records for this pet
        const medicalRecords = await MedicalRecord.find({ pet_id: petId })
            .sort({ visit_date: -1 })
            .limit(5)
            .lean();

        // Prepare input data with ALL pet information
        const inputData = {
            pet: {
                name: pet.name,
                species: pet.species,
                breed: pet.breed,
                age_months: pet.age_months,
                weight_kg: pet.weight_kg,
                gender: pet.gender,
                sterilized: pet.sterilized,
                color: pet.color,
                fur_type: pet.fur_type,
                allergies: pet.allergies,
                notes: pet.notes
            },
            medicalRecords: medicalRecords.map(r => ({
                type: r.record_type,
                diagnosis: r.diagnosis,
                treatment: r.treatment,
                vaccines: r.vaccines,
                visit_date: r.visit_date
            }))
        };

        let analysis;
        let isFallback = false;

        try {
            // Try AI analysis first
            analysis = await generatePersonalityAnalysis(inputData);
        } catch (aiError) {
            console.error("[Personality API] AI failed, using fallback:", aiError);
            // Fallback to rule-based analysis
            analysis = generateRuleBasedPersonality(inputData.pet);
            isFallback = true;
        }

        // Save analysis to pet document
        const now = new Date();
        await Pet.findByIdAndUpdate(petId, {
            $set: {
                "ai_analysis.personality_analysis": {
                    ...analysis,
                    analyzed_at: now
                }
            }
        });

        return NextResponse.json({
            success: true,
            data: {
                pet_id: pet._id.toString(),
                pet_name: pet.name,
                analysis: {
                    ...analysis,
                    analyzed_at: now.toISOString()
                },
                is_cached: false,
                is_outdated: false,
                is_fallback: isFallback
            }
        });
    } catch (error) {
        console.error("[Personality API] POST Error:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
