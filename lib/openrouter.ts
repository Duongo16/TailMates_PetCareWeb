// OpenRouter API Client for TailMates AI Suggestions

import { AISuggestionInput, PetAnalysis, FoodRecommendation, ServiceRecommendation } from "./types/ai-suggestions";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

interface OpenRouterResponse {
    analysis: PetAnalysis;
    food_recommendations: FoodRecommendation[];
    service_recommendations: ServiceRecommendation[];
}

const FREE_MODEL_CHAIN = [
    "liquid/lfm-2.5-1.2b-thinking:free",
];

// Helper for fetch with timeout
async function fetchWithTimeout(url: string, options: RequestInit & { timeout?: number }) {
    const { timeout = 45000 } = options; // Default 45s

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error: any) {
        clearTimeout(id);
        if (error.name === 'AbortError') {
            throw new Error(`Request timeout after ${timeout / 1000}s`);
        }
        throw error;
    }
}

function buildSystemPrompt(): string {
    return `# TailMates AI Pet Nutritionist & Care Advisor

Bạn là chuyên gia dinh dưỡng thú y và tư vấn chăm sóc thú cưng cho nền tảng TailMates Việt Nam.

## NHIỆM VỤ
1. Phân tích sức khỏe thú cưng dựa trên thông tin cung cấp
2. Tính toán các CHỈ SỐ SỨC KHỎE (Health Indices) với giá trị 0-100
3. Đánh giá độ PHÙ HỢP (Match Point 0-100) cho từng sản phẩm/dịch vụ
4. Giải thích LÝ DO bằng tiếng Việt, dễ hiểu cho người dùng

## QUY TẮC QUAN TRỌNG
- **Dị ứng**: Nếu thú cưng dị ứng với thành phần nào → sản phẩm chứa thành phần đó = 0 điểm
- **Loài**: Sản phẩm cho Chó không bao giờ gợi ý cho Mèo và ngược lại
- **Tuổi**: Kitten/Puppy food cho thú < 12 tháng, Senior cho > 84 tháng
- **Triệt sản**: Ưu tiên sản phẩm "Weight Management" nếu đã triệt sản
- **Tiêm phòng**: Nếu > 12 tháng chưa tiêm → Urgency = CRITICAL

## HEALTH INDICES CẦN TÍNH (chọn 4-6 chỉ số phù hợp nhất)
1. **Nhu cầu Protein** - Dựa trên tuổi, giống, hoạt động
2. **Kiểm soát Cân nặng** - So sánh với cân nặng chuẩn của giống
3. **Sức khỏe Da & Lông** - Dựa trên fur_type và notes
4. **Sức khỏe Tiêu hóa** - Dựa trên lịch sử y tế
5. **Nhu cầu Vitamin** - Dựa trên tuổi và chế độ ăn
6. **Cần khám định kỳ** - Dựa trên lịch sử khám
7. **Sức khỏe Xương khớp** - Cho giống lớn hoặc senior
8. **Nhu cầu Năng lượng** - Dựa trên tuổi và hoạt động

## MATCH METRICS CHO THỨC ĂN
- species_match: Đúng loài = 100, sai = 0
- life_stage_fit: Đúng giai đoạn = 100, gần = 70, xa = 30
- allergy_safety: Không chứa allergen = 100, chứa = 0  
- health_tag_match: % health tags phù hợp với indices
- nutritional_balance: Phù hợp nhu cầu protein/fat/fiber

## OUTPUT FORMAT
Trả về JSON với cấu trúc chính xác sau:
{
  "analysis": {
    "health_summary": "Tóm tắt sức khỏe bằng tiếng Việt, 2-3 câu",
    "weight_status": "NORMAL" | "UNDERWEIGHT" | "OVERWEIGHT",
    "activity_level": "LOW" | "MODERATE" | "HIGH",
    "nutritional_needs": {
      "protein": "HIGH" | "MEDIUM" | "LOW",
      "fat": "HIGH" | "MEDIUM" | "LOW",
      "fiber": "HIGH" | "MEDIUM" | "LOW",
      "specialDiet": "string hoặc null",
      "avoidIngredients": ["danh sách thành phần cần tránh"]
    },
    "health_indices": [
      {
        "label": "Tên chỉ số bằng tiếng Việt",
        "value": 0-100 (SỐ NGUYÊN),
        "status": "low" | "medium" | "high",
        "reason": "Giải thích ngắn gọn bằng tiếng Việt",
        "icon": "protein" | "heart" | "bone" | "stomach" | "vitamin" | "checkup" | "energy" | "fur"
      }
    ]
  },
  "food_recommendations": [
    {
      "product_id": "ID sản phẩm từ danh sách",
      "product_name": "Tên sản phẩm",
      "match_point": 0-100 (SỐ NGUYÊN),
      "metrics": {
        "species_match": 0-100,
        "life_stage_fit": 0-100,
        "allergy_safety": 0-100,
        "health_tag_match": 0-100,
        "nutritional_balance": 0-100
      },
      "reasoning": "Giải thích bằng tiếng Việt tại sao phù hợp"
    }
  ],
  "service_recommendations": [
    {
      "service_id": "ID dịch vụ từ danh sách",
      "service_name": "Tên dịch vụ",
      "match_point": 0-100 (SỐ NGUYÊN),
      "urgency": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      "urgency_reason": "Lý do mức độ khẩn cấp",
      "reasoning": "Giải thích bằng tiếng Việt"
    }
  ]
}

**LƯU Ý QUAN TRỌNG**: 
- Các giá trị score/point (value, match_point, metrics) PHẢI là số nguyên (Integer), KHÔNG ĐƯỢC để dạng dải (như 0-100) hay chuỗi.
- Không bao giờ bịa đặt ID sản phẩm/dịch vụ. Chỉ dùng ID được cung cấp.
- Trả về JSON thuần túy, không kèm văn bản giải thích bên ngoài.`;
}

function buildUserPrompt(data: AISuggestionInput): string {
    const formatDate = (date: Date) => {
        try {
            return new Date(date).toLocaleDateString("vi-VN");
        } catch {
            return "N/A";
        }
    };

    return `## THÔNG TIN THÚ CƯNG
- Tên: ${data.pet.name}
- Loài: ${data.pet.species}
- Giống: ${data.pet.breed || "Không rõ"}
- Tuổi: ${data.pet.age_months} tháng (${Math.floor(data.pet.age_months / 12)} năm ${data.pet.age_months % 12} tháng)
- Cân nặng: ${data.pet.weight_kg || "Không rõ"} kg
- Giới tính: ${data.pet.gender}
- Đã triệt sản: ${data.pet.sterilized ? "Có" : "Không"}
- Dị ứng: ${data.pet.allergies?.length > 0 ? data.pet.allergies.join(", ") : "Không có thông tin"}
- Ghi chú từ chủ: ${data.pet.notes || "Không có"}

## LỊCH SỬ Y TẾ (${data.medicalRecords.length} bản ghi gần nhất)
${data.medicalRecords.length > 0
            ? data.medicalRecords.map((r, i) => `
${i + 1}. [${r.type}] Ngày: ${formatDate(r.visit_date)}
   - Chẩn đoán: ${r.diagnosis}
   - Điều trị: ${r.treatment || "Không có"}
   - Vaccine đã tiêm: ${r.vaccines?.length ? r.vaccines.join(", ") : "Không có"}
`).join("")
            : "Chưa có lịch sử y tế nào được ghi nhận."
        }

## DANH MỤC SẢN PHẨM THỨC ĂN (${data.products.length} sản phẩm có sẵn)
${data.products.length > 0
            ? data.products.map(p => `
[${p.id}] ${p.name}
- Giá: ${p.price.toLocaleString("vi-VN")}đ ${p.sale_price ? `(Khuyến mãi: ${p.sale_price.toLocaleString("vi-VN")}đ)` : ""}
- Loài phù hợp: ${p.specifications?.targetSpecies || "Tất cả"}
- Giai đoạn: ${p.specifications?.lifeStage || "Tất cả"}
- Kích cỡ giống: ${p.specifications?.breedSize || "Tất cả"}
- Health Tags: ${p.specifications?.healthTags?.join(", ") || "Không có"}
- Thành phần chính: ${p.specifications?.primaryProteinSource || "Không rõ"}
- Dinh dưỡng: Protein ${p.specifications?.nutritionalInfo?.protein || "?"}%, Fat ${p.specifications?.nutritionalInfo?.fat || "?"}%, Fiber ${p.specifications?.nutritionalInfo?.fiber || "?"}%
`).join("")
            : "Không có sản phẩm thức ăn nào."
        }

## DANH MỤC DỊCH VỤ (${data.services.length} dịch vụ có sẵn)
${data.services.length > 0
            ? data.services.map(s => `
[${s.id}] ${s.name}
- Loại: ${s.category}
- Giá: ${s.price_min.toLocaleString("vi-VN")}đ - ${s.price_max.toLocaleString("vi-VN")}đ
`).join("")
            : "Không có dịch vụ nào."
        }

## YÊU CẦU
Hãy phân tích sức khỏe thú cưng và gợi ý:
- TOP 5 sản phẩm thức ăn phù hợp nhất (nếu có đủ sản phẩm)
- TOP 3 dịch vụ cần thiết nhất (nếu có đủ dịch vụ)

Trả về JSON theo đúng format đã quy định.`;
}

export async function generateAISuggestions(data: AISuggestionInput): Promise<OpenRouterResponse> {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        throw new Error("OPENROUTER_API_KEY is not configured");
    }

    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(data);

    console.log("[OpenRouter] Sending request for pet:", data.pet.name);
    console.time(`OpenRouter-${data.pet.name}`);

    const result = await callOpenRouterWithFallback(systemPrompt, userPrompt, data.pet.name);

    console.timeEnd(`OpenRouter-${data.pet.name}`);

    if (!result.choices?.[0]?.message?.content) {
        throw new Error("Invalid response from OpenRouter");
    }

    const content = result.choices[0].message.content;
    const petType = data.pet.species || "thú cưng";

    try {
        const parsed = tryExtractJSON(content);

        // --- Deep Sanitize Analysis ---
        const rawAnalysis = parsed.analysis || parsed; // Handle flattened response
        const analysis: PetAnalysis = {
            health_summary: rawAnalysis.health_summary || "Không thể phân tích",
            weight_status: rawAnalysis.weight_status || "NORMAL",
            activity_level: rawAnalysis.activity_level || "MODERATE",
            nutritional_needs: {
                protein: rawAnalysis.nutritional_needs?.protein || "MEDIUM",
                fat: rawAnalysis.nutritional_needs?.fat || "MEDIUM",
                fiber: rawAnalysis.nutritional_needs?.fiber || "MEDIUM",
                specialDiet: rawAnalysis.nutritional_needs?.specialDiet || null,
                avoidIngredients: Array.isArray(rawAnalysis.nutritional_needs?.avoidIngredients)
                    ? rawAnalysis.nutritional_needs.avoidIngredients
                    : []
            },
            health_indices: Array.isArray(rawAnalysis.health_indices)
                ? rawAnalysis.health_indices.map((idx: any) => ({
                    label: idx.label || "Chỉ số",
                    value: sanitizeScore(idx.value),
                    status: idx.status || "medium",
                    reason: idx.reason || "",
                    icon: idx.icon || "heart"
                }))
                : []
        };

        // --- Sanitize Food Recs ---
        const food_recommendations = (Array.isArray(parsed.food_recommendations) ? parsed.food_recommendations : [])
            .map((f: any) => {
                const product = data.products.find(p => p.id === f.product_id);
                return {
                    product_id: f.product_id || "unknown",
                    product_name: f.product_name || product?.name || "Sản phẩm",
                    match_point: sanitizeScore(f.match_point),
                    product_image: product?.image,
                    price: f.price || product?.price || 0,
                    sale_price: f.sale_price ?? product?.sale_price,
                    metrics: f.metrics ? {
                        species_match: sanitizeScore(f.metrics.species_match),
                        life_stage_fit: sanitizeScore(f.metrics.life_stage_fit),
                        allergy_safety: sanitizeScore(f.metrics.allergy_safety),
                        health_tag_match: sanitizeScore(f.metrics.health_tag_match),
                        nutritional_balance: sanitizeScore(f.metrics.nutritional_balance)
                    } : {
                        species_match: 50,
                        life_stage_fit: 50,
                        allergy_safety: 100,
                        health_tag_match: 50,
                        nutritional_balance: 50
                    },
                    reasoning: f.reasoning || `Gợi ý dành cho ${petType}`
                };
            });

        // --- Sanitize Service Recs ---
        const service_recommendations = (Array.isArray(parsed.service_recommendations) ? parsed.service_recommendations : [])
            .map((s: any) => {
                const service = data.services.find(svc => svc.id === s.service_id);
                return {
                    service_id: s.service_id || "unknown",
                    service_name: s.service_name || service?.name || "Dịch vụ",
                    match_point: sanitizeScore(s.match_point),
                    service_image: service?.image,
                    urgency: s.urgency || "MEDIUM",
                    urgency_reason: s.urgency_reason || "",
                    reasoning: s.reasoning || `Gợi ý dành cho ${petType}`,
                    price_range: s.price_range || {
                        min: service?.price_min || 0,
                        max: service?.price_max || 0
                    }
                };
            });

        return {
            analysis,
            food_recommendations,
            service_recommendations
        };
    } catch (parseError) {
        console.error("[OpenRouter] Failed to parse response:", content);
        throw new Error("Failed to parse AI response");
    }
}

/**
 * Robustly extract JSON from AI response that might contain preamble/postamble.
 */
function tryExtractJSON(text: string): any {
    try {
        // Quick path: directly parse if clean
        return JSON.parse(text);
    } catch {
        // Find first { and last }
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');

        if (start === -1 || end === -1 || end < start) {
            throw new Error("No JSON structure found in response");
        }

        const jsonStr = text.substring(start, end + 1);
        try {
            return JSON.parse(jsonStr);
        } catch (innerError) {
            // Last ditch: try cleaning up common issues like trailing commas or non-standard characters
            const cleaned = jsonStr.replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, " ");
            try {
                return JSON.parse(cleaned);
            } catch {
                throw new Error(`Failed to parse extracted JSON content: ${innerError}`);
            }
        }
    }
}

/**
 * Handle AI hallucinations like "0-100" or "Không có" in numeric fields.
 */
function sanitizeScore(value: any): number {
    if (typeof value === 'number') return Math.max(0, Math.min(100, Math.round(value)));

    const strValue = String(value).trim();

    // Handle range like "0-100"
    if (strValue.includes('-')) {
        const parts = strValue.split('-');
        const low = parseInt(parts[0]);
        const high = parseInt(parts[1]);
        if (!isNaN(low) && !isNaN(high)) return Math.max(0, Math.min(100, Math.round((low + high) / 2)));
        if (!isNaN(low)) return Math.max(0, Math.min(100, low));
    }

    // Handle string numbers
    const num = parseInt(strValue.replace(/[^0-9]/g, ''));
    if (!isNaN(num)) return Math.max(0, Math.min(100, num));

    return 50; // Default fallback
}

/**
 * Calls OpenRouter with a chain of fallback models for better reliability.
 */
async function callOpenRouterWithFallback(systemPrompt: string, userPrompt: string, petName: string): Promise<any> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    let lastError = null;

    for (const model of FREE_MODEL_CHAIN) {
        try {
            console.log(`[OpenRouter] Trying model: ${model} for ${petName}`);
            const response = await fetchWithTimeout(OPENROUTER_API_URL, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
                    "X-Title": "TailMates Pet Care"
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userPrompt }
                    ],
                    temperature: 0.3,
                    max_tokens: 4000
                }),
                timeout: 20000 // 20s per model
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Error ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            if (result.choices?.[0]?.message?.content) {
                console.log(`[OpenRouter] Success with model: ${model}`);
                return result;
            }
            throw new Error("Empty response content");

        } catch (err: any) {
            console.warn(`[OpenRouter] Model ${model} failed:`, err.message);
            lastError = err;
            // Continue to next model
        }
    }

    throw lastError || new Error("All models in fallback chain failed");
}

// Fallback rule-based recommendations when AI is unavailable
export function generateRuleBasedRecommendations(
    pet: AISuggestionInput["pet"],
    products: AISuggestionInput["products"],
    services: AISuggestionInput["services"]
): OpenRouterResponse {
    const isKitten = pet.age_months < 12;
    const isSenior = pet.age_months > 84;
    const speciesMap: Record<string, string> = {
        "Dog": "DOG",
        "Cat": "CAT",
        "Chó": "DOG",
        "Mèo": "CAT"
    };
    const targetSpecies = speciesMap[pet.species] || pet.species.toUpperCase();

    // Filter products by species
    const matchingProducts = products
        .filter(p => {
            if (!p.specifications?.targetSpecies) return true;
            return p.specifications.targetSpecies === targetSpecies;
        })
        .map(p => {
            let score = 50; // Base score

            // Life stage bonus
            if (isKitten && p.specifications?.lifeStage === "KITTEN_PUPPY") score += 30;
            else if (isSenior && p.specifications?.lifeStage === "SENIOR") score += 30;
            else if (p.specifications?.lifeStage === "ADULT" || p.specifications?.lifeStage === "ALL_STAGES") score += 20;

            // Sterilized bonus
            if (pet.sterilized && p.specifications?.healthTags?.includes("Weight Management")) score += 10;

            // Allergy check
            const hasAllergen = pet.allergies.some(allergy =>
                p.specifications?.ingredients?.some(i =>
                    i.toLowerCase().includes(allergy.toLowerCase())
                ) ||
                p.specifications?.primaryProteinSource?.toLowerCase().includes(allergy.toLowerCase())
            );
            if (hasAllergen) score = 0;

            return {
                product_id: p.id,
                product_name: p.name,
                product_image: p.image,
                match_point: Math.min(100, score),
                metrics: {
                    species_match: p.specifications?.targetSpecies === targetSpecies ? 100 : 50,
                    life_stage_fit: score >= 70 ? 100 : 60,
                    allergy_safety: hasAllergen ? 0 : 100,
                    health_tag_match: 70,
                    nutritional_balance: 70
                },
                reasoning: "Gợi ý dựa trên quy tắc cơ bản (AI tạm thời không khả dụng)",
                price: p.price,
                sale_price: p.sale_price
            };
        })
        .filter(p => p.match_point > 0)
        .sort((a, b) => b.match_point - a.match_point)
        .slice(0, 5);

    // Service recommendations
    const serviceRecommendations = services
        .map(s => ({
            service_id: s.id,
            service_name: s.name,
            service_image: s.image,
            match_point: 70,
            urgency: "MEDIUM" as const,
            urgency_reason: "Khuyến nghị kiểm tra định kỳ",
            reasoning: "Gợi ý dựa trên quy tắc cơ bản",
            price_range: { min: s.price_min, max: s.price_max }
        }))
        .slice(0, 3);

    return {
        analysis: {
            health_summary: `${pet.name} là ${pet.species} ${pet.breed || ""} ${pet.age_months} tháng tuổi. Cần theo dõi sức khỏe định kỳ.`,
            weight_status: "NORMAL",
            activity_level: "MODERATE",
            nutritional_needs: {
                protein: isKitten ? "HIGH" : "MEDIUM",
                fat: isKitten ? "HIGH" : "MEDIUM",
                fiber: "MEDIUM",
                specialDiet: pet.sterilized ? "Weight Management" : null,
                avoidIngredients: pet.allergies
            },
            health_indices: [
                {
                    label: "Nhu cầu Protein",
                    value: isKitten ? 85 : 70,
                    status: isKitten ? "high" : "medium",
                    reason: isKitten ? "Đang trong giai đoạn phát triển" : "Nhu cầu protein bình thường",
                    icon: "protein"
                },
                {
                    label: "Kiểm tra sức khỏe",
                    value: 60,
                    status: "medium",
                    reason: "Nên khám định kỳ để theo dõi sức khỏe",
                    icon: "checkup"
                }
            ]
        },
        food_recommendations: matchingProducts,
        service_recommendations: serviceRecommendations
    };
}

// ==================== Personality Analysis ====================

interface PersonalityInput {
    pet: {
        name: string;
        species: string;
        breed?: string;
        age_months: number;
        weight_kg?: number;
        gender: string;
        sterilized: boolean;
        color?: string;
        fur_type?: string;
        allergies?: string[];
        notes?: string;
    };
    medicalRecords?: Array<{
        type: string;
        diagnosis: string;
        treatment?: string;
        vaccines?: string[];
        visit_date: Date;
    }>;
}

interface PersonalityAnalysisOutput {
    type: string;
    traits: string[];
    behavior_explanation: string;
    breed_specs: {
        appearance: string[];
        temperament: string[];
        exercise_minutes_per_day: number;
        shedding_level: "LOW" | "MEDIUM" | "HIGH";
        grooming_needs: string;
    };
    care_guide: {
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
    };
    warnings: {
        genetic_diseases: string[];
        dangerous_foods: string[];
        environment_hazards: string[];
    };
}

function buildPersonalitySystemPrompt(): string {
    return `# VAI TRÒ (ROLE)
Bạn là một chuyên gia thú y và nhà hành vi học động vật (Animal Behaviorist) với 20 năm kinh nghiệm. Nhiệm vụ của bạn là phân tích dữ liệu của thú cưng, từ đó đưa ra bản báo cáo chi tiết về tính cách, hướng dẫn chăm sóc và các cảnh báo sức khỏe quan trọng.

## YÊU CẦU ĐẦU RA
Hãy phân tích và trả về JSON theo cấu trúc 4 phần sau đây. Giọng văn thân thiện, chuyên nghiệp, dễ hiểu.

### Phần 1: Phân tích Tính cách & Hành vi (type, traits, behavior_explanation)
- type: Tên kiểu tính cách ngắn gọn (ví dụ: "Kẻ tinh nghịch năng động", "Người bảo vệ trung thành")
- traits: Mảng 3-5 tính cách đặc trưng
- behavior_explanation: Giải thích tại sao bé có hành vi đó (do gen của giống hay do độ tuổi?)

### Phần 2: Kiến thức & Đặc điểm Giống loài (breed_specs)
- appearance: 3 điểm đặc trưng về ngoại hình
- temperament: 3 điểm đặc trưng về tính cách giống
- exercise_minutes_per_day: Số phút vận động cần thiết mỗi ngày
- shedding_level: Mức độ rụng lông ("LOW", "MEDIUM", "HIGH")
- grooming_needs: Mô tả nhu cầu chải chuốt

### Phần 3: Hướng dẫn Chăm sóc theo Độ tuổi (care_guide)
- nutrition: { meals_per_day, food_type, tips[] } - Chế độ ăn phù hợp độ tuổi
- medical: { vaccines[], notes[] } - Mũi tiêm cần thiết, lưu ý y tế
- training: { command, tips[] } - 1 bài tập/mệnh lệnh nên dạy ngay

### Phần 4: Cảnh báo & Lưu ý đặc biệt (warnings)
- genetic_diseases: Các bệnh di truyền thường gặp ở giống
- dangerous_foods: Thực phẩm nguy hiểm cho giống này
- environment_hazards: Môi trường gây nguy hiểm

## QUY TẮC QUAN TRỌNG
- Trả về JSON thuần túy, không markdown code block
- Tất cả text phải bằng tiếng Việt
- Thông tin phải chính xác theo khoa học thú y
- Tư vấn sát với độ tuổi hiện tại của bé`;
}

function buildPersonalityUserPrompt(data: PersonalityInput): string {
    const formatDate = (date: Date) => {
        try {
            return new Date(date).toLocaleDateString("vi-VN");
        } catch {
            return "N/A";
        }
    };

    const years = Math.floor(data.pet.age_months / 12);
    const months = data.pet.age_months % 12;
    const ageString = years > 0
        ? `${years} tuổi ${months > 0 ? `${months} tháng` : ""}`
        : `${months} tháng`;

    return `## DỮ LIỆU ĐẦU VÀO
- Loài vật: ${data.pet.species}
- Giống (Breed): ${data.pet.breed || "Không rõ giống"}
- Độ tuổi: ${ageString} (${data.pet.age_months} tháng tuổi)
- Cân nặng: ${data.pet.weight_kg ? `${data.pet.weight_kg} kg` : "Chưa cập nhật"}
- Giới tính: ${data.pet.gender === "MALE" ? "Đực" : "Cái"}
- Đã triệt sản: ${data.pet.sterilized ? "Có" : "Không"}
- Màu lông: ${data.pet.color || "Chưa cập nhật"}
- Loại lông: ${data.pet.fur_type || "Chưa cập nhật"}
- Dị ứng đã biết: ${data.pet.allergies?.length ? data.pet.allergies.join(", ") : "Không có thông tin"}
- Đặc điểm/Thói quen nổi bật: ${data.pet.notes || "Chưa có ghi chú"}

## LỊCH SỬ Y TẾ
${data.medicalRecords && data.medicalRecords.length > 0
            ? data.medicalRecords.slice(0, 5).map((r, i) => `
${i + 1}. [${r.type}] Ngày: ${formatDate(r.visit_date)}
   - Chẩn đoán: ${r.diagnosis}
   - Điều trị: ${r.treatment || "Không có"}
   - Vaccine: ${r.vaccines?.length ? r.vaccines.join(", ") : "Không có"}`).join("")
            : "Chưa có lịch sử y tế nào được ghi nhận."}

Hãy phân tích và trả về JSON theo format đã quy định.`;
}

export async function generatePersonalityAnalysis(data: PersonalityInput): Promise<PersonalityAnalysisOutput> {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        throw new Error("OPENROUTER_API_KEY is not configured");
    }

    const systemPrompt = buildPersonalitySystemPrompt();
    const userPrompt = buildPersonalityUserPrompt(data);

    console.log("[OpenRouter] Generating personality analysis for:", data.pet.name);
    console.time(`Personality-${data.pet.name}`);

    const result = await callOpenRouterWithFallback(systemPrompt, userPrompt, data.pet.name);

    console.timeEnd(`Personality-${data.pet.name}`);

    const content = result.choices[0].message.content;

    try {
        const parsed = tryExtractJSON(content);

        // --- Deep Sanitize Personality Result ---
        return {
            type: parsed.type || "Tính cách chưa xác định",
            traits: Array.isArray(parsed.traits) ? parsed.traits : [],
            behavior_explanation: parsed.behavior_explanation || "",
            breed_specs: {
                appearance: Array.isArray(parsed.breed_specs?.appearance) ? parsed.breed_specs.appearance : [],
                temperament: Array.isArray(parsed.breed_specs?.temperament) ? parsed.breed_specs.temperament : [],
                exercise_minutes_per_day: typeof parsed.breed_specs?.exercise_minutes_per_day === 'number'
                    ? parsed.breed_specs.exercise_minutes_per_day
                    : sanitizeScore(parsed.breed_specs?.exercise_minutes_per_day || 30),
                shedding_level: parsed.breed_specs?.shedding_level || "MEDIUM",
                grooming_needs: parsed.breed_specs?.grooming_needs || ""
            },
            care_guide: {
                nutrition: {
                    meals_per_day: typeof parsed.care_guide?.nutrition?.meals_per_day === 'number'
                        ? parsed.care_guide.nutrition.meals_per_day
                        : parseInt(String(parsed.care_guide?.nutrition?.meals_per_day)) || 2,
                    food_type: parsed.care_guide?.nutrition?.food_type || "",
                    tips: Array.isArray(parsed.care_guide?.nutrition?.tips) ? parsed.care_guide.nutrition.tips : []
                },
                medical: {
                    vaccines: Array.isArray(parsed.care_guide?.medical?.vaccines) ? parsed.care_guide.medical.vaccines : [],
                    notes: Array.isArray(parsed.care_guide?.medical?.notes) ? parsed.care_guide.medical.notes : []
                },
                training: {
                    command: parsed.care_guide?.training?.command || "",
                    tips: Array.isArray(parsed.care_guide?.training?.tips) ? parsed.care_guide.training.tips : []
                }
            },
            warnings: {
                genetic_diseases: Array.isArray(parsed.warnings?.genetic_diseases) ? parsed.warnings.genetic_diseases : [],
                dangerous_foods: Array.isArray(parsed.warnings?.dangerous_foods) ? parsed.warnings.dangerous_foods : [],
                environment_hazards: Array.isArray(parsed.warnings?.environment_hazards) ? parsed.warnings.environment_hazards : []
            }
        };
    } catch (parseError) {
        console.error("[OpenRouter] Failed to parse personality response:", content);
        throw new Error("Failed to parse AI personality response");
    }
}

// Fallback rule-based personality analysis
export function generateRuleBasedPersonality(pet: PersonalityInput["pet"]): PersonalityAnalysisOutput {
    const isYoung = pet.age_months < 12;
    const isSenior = pet.age_months > 84;

    const getPersonalityType = () => {
        if (isYoung) return "Kẻ tinh nghịch năng động";
        if (isSenior) return "Người bạn điềm đạm";
        return "Người bạn đồng hành trung thành";
    };

    return {
        type: getPersonalityType(),
        traits: isYoung
            ? ["Hiếu động", "Thích khám phá", "Hay nghịch ngợm"]
            : ["Trung thành", "Thân thiện", "Bình tĩnh"],
        behavior_explanation: `Do ${pet.breed || pet.species} ở độ tuổi ${pet.age_months} tháng, bé thường có xu hướng ${isYoung ? "năng động và thích khám phá" : "ổn định và bình tĩnh hơn"}.`,
        breed_specs: {
            appearance: ["Đặc trưng của giống"],
            temperament: ["Thân thiện", "Dễ gần"],
            exercise_minutes_per_day: isYoung ? 60 : (isSenior ? 20 : 40),
            shedding_level: "MEDIUM",
            grooming_needs: "Chải lông 2-3 lần/tuần"
        },
        care_guide: {
            nutrition: {
                meals_per_day: isYoung ? 3 : 2,
                food_type: isYoung ? "Thức ăn cho thú non" : "Thức ăn cho thú trưởng thành",
                tips: ["Cho ăn đúng giờ", "Đảm bảo nước sạch"]
            },
            medical: {
                vaccines: isYoung ? ["Vaccine tổng hợp", "Vaccine dại"] : ["Tiêm nhắc lại định kỳ"],
                notes: ["Khám định kỳ 6 tháng/lần"]
            },
            training: {
                command: isYoung ? "Ngồi (Sit)" : "Đến đây (Come)",
                tips: ["Kiên nhẫn", "Khen thưởng khi làm đúng"]
            }
        },
        warnings: {
            genetic_diseases: ["Cần tham khảo bác sĩ thú y"],
            dangerous_foods: ["Chocolate", "Nho", "Hành tỏi", "Xylitol"],
            environment_hazards: ["Cây độc trong nhà", "Dây điện"]
        }
    };
}

