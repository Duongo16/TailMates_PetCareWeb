/**
 * Import customer accounts (1-3/day) from 02/02/2026 to 26/02/2026
 * Run: node scripts/import-customers-batch2.js
 */

const { config } = require("dotenv");
const { resolve } = require("path");
const mongoose = require("mongoose");

config({ path: resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not defined");
  process.exit(1);
}

// Pool of unique Vietnamese names (enough for ~75 accounts max: 25 days × 3)
const names = [
  ["Trần", "Quang", "Huy"],
  ["Lê", "Thị", "Loan"],
  ["Phạm", "Văn", "Tú"],
  ["Nguyễn", "Hoàng", "Phát"],
  ["Võ", "Thị", "Ngân"],
  ["Đặng", "Minh", "Trí"],
  ["Bùi", "Thị", "Thương"],
  ["Hoàng", "Đức", "Hậu"],
  ["Phan", "Thị", "Lệ"],
  ["Vũ", "Văn", "Tiến"],
  ["Ngô", "Thị", "Hồng"],
  ["Trịnh", "Quốc", "Đại"],
  ["Đỗ", "Thị", "Mỹ"],
  ["Lý", "Hoàng", "Việt"],
  ["Dương", "Thị", "Ngọc"],
  ["Hồ", "Minh", "Đức"],
  ["Lương", "Thị", "Thanh"],
  ["Mai", "Văn", "Hòa"],
  ["Tạ", "Thị", "Phúc"],
  ["Đinh", "Quang", "Bảo"],
  ["Trần", "Thị", "Xuân"],
  ["Nguyễn", "Văn", "Thành"],
  ["Lê", "Minh", "Tuấn"],
  ["Phạm", "Thị", "Diễm"],
  ["Võ", "Đức", "Thắng"],
  ["Đặng", "Thị", "Hà"],
  ["Bùi", "Hoàng", "Khải"],
  ["Hoàng", "Thị", "Tuyền"],
  ["Phan", "Văn", "Lực"],
  ["Vũ", "Thị", "Vy"],
  ["Ngô", "Minh", "Tâm"],
  ["Trịnh", "Thị", "Phượng"],
  ["Đỗ", "Quốc", "Hùng"],
  ["Lý", "Thị", "Liên"],
  ["Dương", "Đức", "Dũng"],
  ["Hồ", "Thị", "Tâm"],
  ["Lương", "Văn", "Phong"],
  ["Mai", "Thị", "Uyên"],
  ["Tạ", "Hoàng", "Sơn"],
  ["Đinh", "Thị", "Cẩm"],
  ["Trần", "Minh", "Hoàng"],
  ["Nguyễn", "Thị", "Ngà"],
  ["Lê", "Văn", "Kiệt"],
  ["Phạm", "Thị", "Yến"],
  ["Võ", "Quốc", "Cường"],
  ["Đặng", "Thị", "Thắm"],
  ["Bùi", "Minh", "Nhân"],
  ["Hoàng", "Thị", "Châu"],
  ["Phan", "Đức", "Trọng"],
  ["Vũ", "Thị", "Quyên"],
  ["Ngô", "Văn", "Hiệp"],
  ["Trịnh", "Thị", "Hạnh"],
  ["Đỗ", "Hoàng", "Khôi"],
  ["Lý", "Thị", "Duyên"],
  ["Dương", "Minh", "Quân"],
  ["Hồ", "Thị", "Trúc"],
  ["Lương", "Quốc", "Anh"],
  ["Mai", "Thị", "Nở"],
  ["Tạ", "Văn", "Đông"],
  ["Đinh", "Thị", "Thuỳ"],
  ["Trần", "Đức", "Lợi"],
  ["Nguyễn", "Thị", "Kiều"],
  ["Lê", "Hoàng", "Bách"],
  ["Phạm", "Thị", "Hiếu"],
  ["Võ", "Văn", "Nghĩa"],
  ["Đặng", "Minh", "Phúc"],
  ["Bùi", "Thị", "Đào"],
  ["Hoàng", "Quốc", "Thái"],
  ["Phan", "Thị", "Nương"],
  ["Vũ", "Đức", "Lâm"],
  ["Ngô", "Thị", "Ánh"],
  ["Trịnh", "Văn", "Tài"],
  ["Đỗ", "Thị", "Lý"],
  ["Lý", "Minh", "Khang"],
  ["Dương", "Thị", "Bảo"],
];

function removeDiacritics(str) {
  const map = {
    'à':'a','á':'a','ả':'a','ã':'a','ạ':'a',
    'ă':'a','ằ':'a','ắ':'a','ẳ':'a','ẵ':'a','ặ':'a',
    'â':'a','ầ':'a','ấ':'a','ẩ':'a','ẫ':'a','ậ':'a',
    'è':'e','é':'e','ẻ':'e','ẽ':'e','ẹ':'e',
    'ê':'e','ề':'e','ế':'e','ể':'e','ễ':'e','ệ':'e',
    'ì':'i','í':'i','ỉ':'i','ĩ':'i','ị':'i',
    'ò':'o','ó':'o','ỏ':'o','õ':'o','ọ':'o',
    'ô':'o','ồ':'o','ố':'o','ổ':'o','ỗ':'o','ộ':'o',
    'ơ':'o','ờ':'o','ớ':'o','ở':'o','ỡ':'o','ợ':'o',
    'ù':'u','ú':'u','ủ':'u','ũ':'u','ụ':'u',
    'ư':'u','ừ':'u','ứ':'u','ử':'u','ữ':'u','ự':'u',
    'ỳ':'y','ý':'y','ỷ':'y','ỹ':'y','ỵ':'y',
    'đ':'d',
    'À':'A','Á':'A','Ả':'A','Ã':'A','Ạ':'A',
    'Ă':'A','Ằ':'A','Ắ':'A','Ẳ':'A','Ẵ':'A','Ặ':'A',
    'Â':'A','Ầ':'A','Ấ':'A','Ẩ':'A','Ẫ':'A','Ậ':'A',
    'È':'E','É':'E','Ẻ':'E','Ẽ':'E','Ẹ':'E',
    'Ê':'E','Ề':'E','Ế':'E','Ể':'E','Ễ':'E','Ệ':'E',
    'Ì':'I','Í':'I','Ỉ':'I','Ĩ':'I','Ị':'I',
    'Ò':'O','Ó':'O','Ỏ':'O','Õ':'O','Ọ':'O',
    'Ô':'O','Ồ':'O','Ố':'O','Ổ':'O','Ỗ':'O','Ộ':'O',
    'Ơ':'O','Ờ':'O','Ớ':'O','Ở':'O','Ỡ':'O','Ợ':'O',
    'Ù':'U','Ú':'U','Ủ':'U','Ũ':'U','Ụ':'U',
    'Ư':'U','Ừ':'U','Ứ':'U','Ử':'U','Ữ':'U','Ự':'U',
    'Ỳ':'Y','Ý':'Y','Ỷ':'Y','Ỹ':'Y','Ỵ':'Y',
    'Đ':'D',
  };
  return str.split('').map(c => map[c] || c).join('');
}

function generateEmail(ho, dem, ten) {
  const tenNorm = removeDiacritics(ten).toLowerCase();
  const hoInit = removeDiacritics(ho).charAt(0).toLowerCase();
  const demInit = removeDiacritics(dem).charAt(0).toLowerCase();
  const suffixes = ["ha", "he", "hs"];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  const prefixes = [17, 18, 19, 20, 21];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const rest = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `${tenNorm}${hoInit}${demInit}${suffix}${prefix}${rest}@fpt.edu.vn`;
}

function generatePhone() {
  const prefixes = ["090", "091", "092", "093", "094", "096", "097", "098", "086", "088"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const rest = String(Math.floor(Math.random() * 10000000)).padStart(7, '0');
  return prefix + rest;
}

const bcryptHash = "$2b$10$C/hjaBQxpd2sKcOPRYXzLOlZOc3CbqljeXQVup3c1XGVaYGc1Utmq";

async function importCustomers() {
  try {
    console.log("🚀 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const startDate = new Date('2026-02-02T06:00:00.000Z');
    const endDate = new Date('2026-02-26T06:00:00.000Z');
    const documents = [];
    let nameIdx = 0;

    // 02/02 to 26/02 = 25 days
    for (let dayIndex = 0; dayIndex < 25; dayIndex++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + dayIndex);

      // Random 1-3 accounts per day
      const count = Math.floor(Math.random() * 3) + 1;

      for (let i = 0; i < count; i++) {
        if (nameIdx >= names.length) break;
        const [ho, dem, ten] = names[nameIdx];
        nameIdx++;
        const fullName = `${ho} ${dem} ${ten}`;
        const email = generateEmail(ho, dem, ten);
        const phone = generatePhone();

        const createdAt = new Date(currentDate);
        createdAt.setHours(Math.floor(Math.random() * 14) + 7);
        createdAt.setMinutes(Math.floor(Math.random() * 60));
        createdAt.setSeconds(Math.floor(Math.random() * 60));

        const updatedAt = new Date(createdAt);
        updatedAt.setDate(updatedAt.getDate() + Math.floor(Math.random() * 5));
        updatedAt.setHours(Math.floor(Math.random() * 14) + 7);

        const balance = Math.floor(Math.random() * 900000) + 100000;
        const refreshTokenVersion = Math.floor(Math.random() * 30) + 1;

        documents.push({
          email,
          password: bcryptHash,
          full_name: fullName,
          phone_number: phone,
          role: "CUSTOMER",
          avatar: {},
          is_active: true,
          merchant_profile: {},
          __v: Math.floor(Math.random() * 3),
          created_at: createdAt,
          updated_at: updatedAt,
          refresh_token_version: refreshTokenVersion,
          tm_balance: balance,
          auth_provider: "EMAIL",
          is_email_verified: false,
        });
      }
    }

    const db = mongoose.connection.db;
    const collection = db.collection("users");
    const result = await collection.insertMany(documents);

    console.log(`\n✅ Successfully imported ${result.insertedCount} customer accounts!`);
    console.log(`📅 Date range: 02/02/2026 → 26/02/2026 (1-3 random accounts/day)`);

    // Show day-by-day breakdown
    console.log("\n📊 Day-by-day breakdown:");
    let docIdx = 0;
    for (let dayIndex = 0; dayIndex < 25; dayIndex++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + dayIndex);
      const dateStr = d.toISOString().split('T')[0];
      const dayDocs = [];
      while (docIdx < documents.length && documents[docIdx].created_at.toISOString().startsWith(dateStr.replace('2026-02-', '2026-02-'))) {
        // Check if same day
        const docDate = documents[docIdx].created_at.toISOString().split('T')[0];
        if (docDate === dateStr) {
          dayDocs.push(documents[docIdx]);
          docIdx++;
        } else {
          break;
        }
      }
      if (dayDocs.length > 0) {
        const names = dayDocs.map(d => d.full_name).join(", ");
        console.log(`   ${dateStr}: ${dayDocs.length} account(s) - ${names}`);
      }
    }

  } catch (error) {
    console.error("❌ Import failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n👋 Disconnected from MongoDB");
  }
}

importCustomers();
