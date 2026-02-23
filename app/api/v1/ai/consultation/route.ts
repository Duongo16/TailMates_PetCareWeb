import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Pet from "@/models/Pet";
import AIConsultation from "@/models/AIConsultation";
import { authenticate, authorize, apiResponse } from "@/lib/auth";
import { UserRole } from "@/models/User";
import { checkAIDailyLimit } from "@/lib/subscription-guard";
import mongoose from "mongoose";

// POST /api/v1/ai/consultation - AI consultation (Magic Button)
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    // Only customers can use AI consultation
    const authError = authorize(user!, [UserRole.CUSTOMER]);
    if (authError) return authError;

    await connectDB();

    const body = await request.json();
    const { pet_id, symptoms_input } = body;

    if (!pet_id || !symptoms_input) {
      return apiResponse.error("Pet ID and symptoms are required");
    }

    if (!mongoose.Types.ObjectId.isValid(pet_id)) {
      return apiResponse.error("Invalid pet ID");
    }

    // --- Bug 5 Fix: Check ai_limit_per_day for today ---
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayCount = await AIConsultation.countDocuments({
      user_id: user!._id,
      created_at: { $gte: startOfToday },
    });
    const aiLimitCheck = await checkAIDailyLimit(user!, todayCount);
    if (!aiLimitCheck.allowed) {
      return apiResponse.forbidden(aiLimitCheck.reason);
    }

    // Verify pet belongs to user
    const pet = await Pet.findById(pet_id);
    if (!pet) {
      return apiResponse.notFound("Pet not found");
    }

    if (pet.owner_id.toString() !== user!._id.toString()) {
      return apiResponse.forbidden("You can only consult about your own pets");
    }

    // TODO: Replace with actual AI integration (OpenAI, Gemini, etc.)
    // For now, generate a mock AI response based on symptoms
    const aiResponse = generateMockAIResponse(pet, symptoms_input);

    // Save consultation history
    const consultation = await AIConsultation.create({
      user_id: user!._id,
      pet_id,
      symptoms_input,
      ai_response: aiResponse,
    });

    return apiResponse.success(
      {
        consultation_id: consultation._id,
        pet_name: pet.name,
        symptoms: symptoms_input,
        ai_advice: aiResponse,
        created_at: consultation.created_at,
      },
      "AI consultation completed"
    );
  } catch (error) {
    console.error("AI consultation error:", error);
    return apiResponse.serverError("AI consultation failed");
  }
}

// GET /api/v1/ai/consultation - Get consultation history
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    await connectDB();

    const { searchParams } = new URL(request.url);
    const pet_id = searchParams.get("pet_id");

    const query: Record<string, unknown> = { user_id: user!._id };
    if (pet_id && mongoose.Types.ObjectId.isValid(pet_id)) {
      query.pet_id = pet_id;
    }

    const consultations = await AIConsultation.find(query)
      .populate("pet_id", "name species breed image")
      .sort({ created_at: -1 })
      .limit(50);

    return apiResponse.success(consultations);
  } catch (error) {
    console.error("Get consultations error:", error);
    return apiResponse.serverError("Failed to get consultations");
  }
}

// Mock AI response generator
function generateMockAIResponse(pet: any, symptoms: string): string {
  const symptomsLower = symptoms.toLowerCase();
  
  let advice = `Dựa trên thông tin về ${pet.name} (${pet.species} - ${pet.breed || "không rõ giống"}):\n\n`;

  if (symptomsLower.includes("nôn") || symptomsLower.includes("ói")) {
    advice += `⚠️ **Triệu chứng nôn mửa:**\n`;
    advice += `- Có thể do ăn quá nhanh, thức ăn không phù hợp, hoặc vấn đề tiêu hóa\n`;
    advice += `- Nếu nôn nhiều lần hoặc có máu, cần đưa đến bác sĩ thú y ngay\n`;
    advice += `- Tạm thời cho nhịn ăn 12 giờ, cho uống nước ít một\n\n`;
  }

  if (symptomsLower.includes("bỏ ăn") || symptomsLower.includes("không ăn")) {
    advice += `⚠️ **Triệu chứng bỏ ăn:**\n`;
    advice += `- Kiểm tra răng miệng xem có vấn đề gì không\n`;
    advice += `- Thử đổi loại thức ăn hoặc làm ấm thức ăn\n`;
    advice += `- Nếu bỏ ăn quá 24 giờ, nên đưa đến khám\n\n`;
  }

  if (symptomsLower.includes("tiêu chảy") || symptomsLower.includes("đi ngoài")) {
    advice += `⚠️ **Triệu chứng tiêu chảy:**\n`;
    advice += `- Có thể do thay đổi chế độ ăn, nhiễm khuẩn hoặc ký sinh trùng\n`;
    advice += `- Cho uống nhiều nước để tránh mất nước\n`;
    advice += `- Nếu kéo dài hơn 2 ngày hoặc có máu, cần khám ngay\n\n`;
  }

  if (symptomsLower.includes("ngứa") || symptomsLower.includes("gãi")) {
    advice += `⚠️ **Triệu chứng ngứa/gãi:**\n`;
    advice += `- Kiểm tra ve, bọ chét trên lông\n`;
    advice += `- Có thể do dị ứng thức ăn hoặc môi trường\n`;
    advice += `- Tắm bằng dầu gội chuyên dụng và vệ sinh chỗ ở\n\n`;
  }

  // Default advice
  advice += `💡 **Khuyến nghị:**\n`;
  advice += `- Theo dõi thêm 24-48 giờ\n`;
  advice += `- Ghi chép các triệu chứng chi tiết\n`;
  advice += `- Nếu tình trạng không cải thiện hoặc trở nên nghiêm trọng, hãy đặt lịch khám với bác sĩ thú y\n\n`;
  advice += `⚕️ Lưu ý: Đây chỉ là tư vấn sơ bộ từ AI. Nếu tình trạng nghiêm trọng, hãy đưa ${pet.name} đến cơ sở thú y gần nhất.`;

  return advice;
}
