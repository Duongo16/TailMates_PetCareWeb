// Script để test OpenRouter API
// Chạy: npx ts-node scripts/test-openrouter.ts

async function testOpenRouter() {
    const apiKey = process.env.OPENROUTER_API_KEY;

    console.log("=== Test OpenRouter API ===\n");

    // Check if API key is configured
    if (!apiKey || apiKey === "your-openrouter-api-key-here") {
        console.error("❌ OPENROUTER_API_KEY chưa được cấu hình!");
        console.log("\n📝 Hướng dẫn:");
        console.log("1. Đăng ký tại https://openrouter.ai");
        console.log("2. Vào Dashboard → API Keys → Create new key");
        console.log("3. Copy API key và thêm vào file .env.local:");
        console.log("   OPENROUTER_API_KEY=sk-or-v1-xxxxxxxx");
        console.log("4. Restart server (npm run dev)");
        return;
    }

    console.log("✅ API Key đã được cấu hình");
    console.log(`   Key prefix: ${apiKey.substring(0, 15)}...`);

    try {
        console.log("\n🔄 Đang gửi request test đến OpenRouter...\n");

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "TailMates Test"
            },
            body: JSON.stringify({
                model: "arcee-ai/trinity-large-preview:free",
                messages: [
                    { role: "user", content: "Xin chào! Hãy trả lời bằng 1 câu ngắn." }
                ],
                max_tokens: 100
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ API Error: ${response.status}`);
            console.error("Response:", errorText);

            if (response.status === 401) {
                console.log("\n💡 Lỗi 401 = API key không hợp lệ hoặc đã hết hạn");
                console.log("   Vui lòng kiểm tra lại API key tại https://openrouter.ai/keys");
            } else if (response.status === 402) {
                console.log("\n💡 Lỗi 402 = Hết credit. Cần nạp thêm credit tại OpenRouter");
            }
            return;
        }

        const result = await response.json();
        console.log("✅ OpenRouter hoạt động bình thường!\n");
        console.log("📝 Response từ AI:");
        console.log(result.choices?.[0]?.message?.content || "No content");
        console.log("\n📊 Model used:", result.model);
        console.log("💰 Tokens used:", result.usage?.total_tokens || "N/A");

    } catch (error) {
        console.error("❌ Lỗi kết nối:", error);
    }
}

// Load .env.local
require('dotenv').config({ path: '.env.local' });
testOpenRouter();
