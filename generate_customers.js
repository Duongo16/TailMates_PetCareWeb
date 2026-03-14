// Generate 80 customer accounts (5/day from 22/02/2026 to 09/03/2026)
const bcryptHash = "$2b$10$C/hjaBQxpd2sKcOPRYXzLOlZOc3CbqljeXQVup3c1XGVaYGc1Utmq";

const names = [
  // Day 1 - 22/02
  ["Trần", "Minh", "Khoa"],
  ["Lê", "Thị", "Hương"],
  ["Phạm", "Đức", "Anh"],
  ["Nguyễn", "Thị", "Mai"],
  ["Võ", "Hoàng", "Long"],
  // Day 2 - 23/02
  ["Đặng", "Văn", "Hùng"],
  ["Bùi", "Thị", "Lan"],
  ["Hoàng", "Quốc", "Tuấn"],
  ["Phan", "Thị", "Ngọc"],
  ["Vũ", "Đình", "Phúc"],
  // Day 3 - 24/02
  ["Ngô", "Tùng", "Nam"],
  ["Trịnh", "Thị", "Thảo"],
  ["Đỗ", "Minh", "Quân"],
  ["Lý", "Thị", "Trang"],
  ["Dương", "Văn", "Bình"],
  // Day 4 - 25/02
  ["Hồ", "Thị", "Yến"],
  ["Lương", "Đức", "Trung"],
  ["Mai", "Thị", "Hà"],
  ["Tạ", "Quang", "Hiếu"],
  ["Đinh", "Thị", "Linh"],
  // Day 5 - 26/02
  ["Trần", "Văn", "Đạt"],
  ["Nguyễn", "Thị", "Phương"],
  ["Lê", "Hoàng", "Duy"],
  ["Phạm", "Thị", "Oanh"],
  ["Võ", "Minh", "Tâm"],
  // Day 6 - 27/02
  ["Đặng", "Thị", "Cúc"],
  ["Bùi", "Quốc", "Khánh"],
  ["Hoàng", "Thị", "Nhung"],
  ["Phan", "Đức", "Thịnh"],
  ["Vũ", "Thị", "Hạnh"],
  // Day 7 - 28/02
  ["Ngô", "Văn", "Sơn"],
  ["Trịnh", "Thị", "Vân"],
  ["Đỗ", "Hoàng", "Lâm"],
  ["Lý", "Đình", "Trí"],
  ["Dương", "Thị", "Ánh"],
  // Day 8 - 01/03
  ["Hồ", "Minh", "Châu"],
  ["Lương", "Thị", "Nga"],
  ["Mai", "Văn", "Kiên"],
  ["Tạ", "Thị", "Diệu"],
  ["Đinh", "Quang", "Vinh"],
  // Day 9 - 02/03
  ["Trần", "Thị", "Thanh"],
  ["Nguyễn", "Đức", "Hải"],
  ["Lê", "Thị", "Thu"],
  ["Phạm", "Hoàng", "Minh"],
  ["Võ", "Thị", "Giang"],
  // Day 10 - 03/03
  ["Đặng", "Minh", "Khôi"],
  ["Bùi", "Thị", "Xuân"],
  ["Hoàng", "Văn", "Tùng"],
  ["Phan", "Thị", "Ly"],
  ["Vũ", "Quốc", "Bảo"],
  // Day 11 - 04/03
  ["Ngô", "Thị", "Hiền"],
  ["Trịnh", "Đức", "Mạnh"],
  ["Đỗ", "Thị", "Nhi"],
  ["Lý", "Văn", "Tài"],
  ["Dương", "Thị", "Kim"],
  // Day 12 - 05/03
  ["Hồ", "Hoàng", "Phong"],
  ["Lương", "Thị", "Quyên"],
  ["Mai", "Đức", "Toàn"],
  ["Tạ", "Thị", "Hoa"],
  ["Đinh", "Văn", "Nghĩa"],
  // Day 13 - 06/03
  ["Trần", "Quốc", "Dũng"],
  ["Nguyễn", "Thị", "Bích"],
  ["Lê", "Minh", "Nhật"],
  ["Phạm", "Thị", "Huyền"],
  ["Võ", "Đình", "Hoà"],
  // Day 14 - 07/03
  ["Đặng", "Thị", "Sen"],
  ["Bùi", "Văn", "Lộc"],
  ["Hoàng", "Thị", "Dung"],
  ["Phan", "Minh", "Quang"],
  ["Vũ", "Thị", "Tuyết"],
  // Day 15 - 08/03
  ["Ngô", "Đức", "Cường"],
  ["Trịnh", "Thị", "Trâm"],
  ["Đỗ", "Văn", "Khải"],
  ["Lý", "Thị", "Uyên"],
  ["Dương", "Hoàng", "Thiện"],
  // Day 16 - 09/03
  ["Hồ", "Văn", "Thắng"],
  ["Lương", "Thị", "Phượng"],
  ["Mai", "Quốc", "An"],
  ["Tạ", "Đức", "Hưng"],
  ["Đinh", "Thị", "Ngân"],
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

const startDate = new Date('2026-02-22T06:00:00.000Z');
const documents = [];

for (let dayIndex = 0; dayIndex < 16; dayIndex++) {
  const currentDate = new Date(startDate);
  currentDate.setDate(currentDate.getDate() + dayIndex);

  for (let i = 0; i < 5; i++) {
    const idx = dayIndex * 5 + i;
    const [ho, dem, ten] = names[idx];
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

    const doc = {
      email,
      password: bcryptHash,
      full_name: fullName,
      phone_number: phone,
      role: "CUSTOMER",
      avatar: {},
      is_active: true,
      merchant_profile: {},
      __v: Math.floor(Math.random() * 3),
      created_at: { "$date": createdAt.toISOString() },
      updated_at: { "$date": updatedAt.toISOString() },
      refresh_token_version: refreshTokenVersion,
      tm_balance: balance,
      auth_provider: "EMAIL",
      is_email_verified: false
    };
    documents.push(doc);
  }
}

const fs = require('fs');
const outputPath = require('path').join(__dirname, 'customers_data.json');
fs.writeFileSync(outputPath, JSON.stringify(documents, null, 2), 'utf8');
console.log(`Generated ${documents.length} customer documents to ${outputPath}`);
