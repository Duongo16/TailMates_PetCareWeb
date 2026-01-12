/**
 * Database Seed Script
 * Run: npx tsx scripts/seed.ts
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local
config({ path: resolve(process.cwd(), ".env.local") });

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not defined in environment variables");
  console.error("   Please create .env.local with MONGODB_URI");
  process.exit(1);
}

// ==================== Model Schemas (Inline for script) ====================

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  full_name: { type: String, required: true },
  phone_number: String,
  role: { type: String, enum: ["CUSTOMER", "MERCHANT", "MANAGER", "ADMIN"], default: "CUSTOMER" },
  avatar: { url: String, public_id: String },
  is_active: { type: Boolean, default: true },
  subscription: {
    package_id: mongoose.Schema.Types.ObjectId,
    started_at: Date,
    expired_at: Date,
    features: [String],
  },
  merchant_profile: {
    shop_name: String,
    address: String,
    description: String,
    rating: { type: Number, default: 0 },
    revenue_stats: { type: Number, default: 0 },
  },
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });

const PetSchema = new mongoose.Schema({
  owner_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  species: { type: String, required: true },
  breed: String,
  age_months: { type: Number, required: true },
  weight_kg: Number,
  gender: { type: String, enum: ["MALE", "FEMALE"], required: true },
  sterilized: { type: Boolean, default: false },
  image: { url: String, public_id: String },
  ai_analysis: { personality: String, dietary_advice: String, care_tips: String },
}, { timestamps: { createdAt: "created_at", updatedAt: false } });

const MedicalRecordSchema = new mongoose.Schema({
  pet_id: { type: mongoose.Schema.Types.ObjectId, ref: "Pet", required: true },
  vet_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  visit_date: { type: Date, required: true },
  diagnosis: { type: String, required: true },
  treatment: String,
  notes: String,
  vaccines: [String],
  attachments: [{ url: String, public_id: String }],
}, { timestamps: { createdAt: "created_at", updatedAt: false } });

const ProductSchema = new mongoose.Schema({
  merchant_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  category: { type: String, enum: ["FOOD", "TOY", "MEDICINE", "ACCESSORY", "HYGIENE", "OTHER"], required: true },
  price: { type: Number, required: true },
  description: String,
  images: [{ url: String, public_id: String }],
  stock_quantity: { type: Number, default: 0 },
  ai_tags: [String],
  is_active: { type: Boolean, default: true },
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });

const ServiceSchema = new mongoose.Schema({
  merchant_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  price_min: { type: Number, required: true },
  price_max: { type: Number, required: true },
  duration_minutes: { type: Number, required: true },
  description: String,
  image: { url: String, public_id: String },
  is_active: { type: Boolean, default: true },
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });

const PackageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  target_role: { type: String, enum: ["CUSTOMER", "MERCHANT"], required: true },
  price: { type: Number, required: true },
  duration_months: { type: Number, required: true },
  description: String,
  features_config: {
    ai_limit_per_day: { type: Number, default: 5 },
    max_pets: { type: Number, default: 1 },
    priority_support: { type: Boolean, default: false },
    unlimited_products: { type: Boolean, default: false },
    qr_scanning: { type: Boolean, default: false },
    advanced_analytics: { type: Boolean, default: false },
  },
  is_active: { type: Boolean, default: true },
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });

// ==================== Models ====================
const User = mongoose.model("User", UserSchema);
const Pet = mongoose.model("Pet", PetSchema);
const MedicalRecord = mongoose.model("MedicalRecord", MedicalRecordSchema);
const Product = mongoose.model("Product", ProductSchema);
const Service = mongoose.model("Service", ServiceSchema);
const Package = mongoose.model("Package", PackageSchema);

// ==================== Seed Data ====================
async function seed() {
  try {
    console.log("🚀 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    console.log("🗑️  Clearing existing data...");
    await Promise.all([
      User.deleteMany({}),
      Pet.deleteMany({}),
      MedicalRecord.deleteMany({}),
      Product.deleteMany({}),
      Service.deleteMany({}),
      Package.deleteMany({}),
    ]);

    // Hash password
    const hashedPassword = await bcrypt.hash("123456", 10);

    // ==================== Create Users ====================
    console.log("👤 Creating users...");
    const users = await User.insertMany([
      {
        email: "customer@tailmates.com",
        password: hashedPassword,
        full_name: "Nguyễn Linh",
        phone_number: "0901234567",
        role: "CUSTOMER",
        avatar: { url: "/diverse-girl-avatar.png", public_id: "avatar_1" },
        is_active: true,
      },
      {
        email: "merchant@tailmates.com",
        password: hashedPassword,
        full_name: "PetCare Clinic",
        phone_number: "0912345678",
        role: "MERCHANT",
        avatar: { url: "/pet-store-logo.jpg", public_id: "avatar_2" },
        is_active: true,
        merchant_profile: {
          shop_name: "PetCare Clinic",
          address: "123 Nguyễn Huệ, Q.1, TP.HCM",
          description: "Chuyên spa và thức ăn cho thú cưng",
          rating: 4.8,
          revenue_stats: 45000000,
        },
      },
      {
        email: "merchant2@tailmates.com",
        password: hashedPassword,
        full_name: "Happy Pet Hospital",
        phone_number: "0923456789",
        role: "MERCHANT",
        is_active: true,
        merchant_profile: {
          shop_name: "Happy Pet Hospital",
          address: "456 Lê Lợi, Q.3, TP.HCM",
          description: "Bệnh viện thú y cao cấp",
          rating: 4.9,
          revenue_stats: 65000000,
        },
      },
      {
        email: "manager@tailmates.com",
        password: hashedPassword,
        full_name: "Trần Quản Lý",
        phone_number: "0934567890",
        role: "MANAGER",
        is_active: true,
      },
      {
        email: "admin@tailmates.com",
        password: hashedPassword,
        full_name: "Admin System",
        phone_number: "0945678901",
        role: "ADMIN",
        is_active: true,
      },
    ]);

    const customer = users[0];
    const merchant1 = users[1];
    const merchant2 = users[2];

    // ==================== Create Pets ====================
    console.log("🐾 Creating pets...");
    const pets = await Pet.insertMany([
      {
        owner_id: customer._id,
        name: "Mochi",
        species: "Cat",
        breed: "Mèo Anh lông ngắn",
        age_months: 24,
        weight_kg: 4.5,
        gender: "FEMALE",
        sterilized: true,
        image: { url: "/cute-british-shorthair-cat.jpg", public_id: "pet_1" },
        ai_analysis: {
          personality: "Tính cách hướng nội, thích nằm yên, hay ngủ",
          dietary_advice: "Cần tránh thức ăn quá mặn, nên ăn hạt cho mèo trong nhà",
          care_tips: "Cần chải lông 2 ngày/lần, vệ sinh tai hàng tuần",
        },
      },
      {
        owner_id: customer._id,
        name: "Lucky",
        species: "Dog",
        breed: "Corgi",
        age_months: 36,
        weight_kg: 12,
        gender: "MALE",
        sterilized: false,
        image: { url: "/adorable-corgi-dog-smiling.jpg", public_id: "pet_2" },
        ai_analysis: {
          personality: "Năng động, thân thiện, thích chạy nhảy",
          dietary_advice: "Cần kiểm soát cân nặng, tránh cho ăn quá nhiều",
          care_tips: "Cần đi dạo ít nhất 30 phút/ngày",
        },
      },
      {
        owner_id: customer._id,
        name: "Bông",
        species: "Rabbit",
        breed: "Holland Lop",
        age_months: 12,
        weight_kg: 2,
        gender: "FEMALE",
        sterilized: false,
        image: { url: "/fluffy-white-holland-lop-rabbit.jpg", public_id: "pet_3" },
        ai_analysis: {
          personality: "Nhút nhát, thích cà rốt, hay ngủ ngày",
          dietary_advice: "Cỏ khô là thức ăn chính, bổ sung rau xanh",
          care_tips: "Cần môi trường yên tĩnh, tránh tiếng ồn",
        },
      },
    ]);

    // ==================== Create Medical Records ====================
    console.log("💉 Creating medical records...");
    await MedicalRecord.insertMany([
      {
        pet_id: pets[0]._id,
        vet_id: merchant2._id,
        visit_date: new Date("2025-12-15"),
        diagnosis: "Khám sức khỏe định kỳ",
        treatment: "Tiêm vaccine dại + FVRCP",
        notes: "Phản ứng tốt, không có tác dụng phụ",
        vaccines: ["Rabies", "FVRCP"],
      },
      {
        pet_id: pets[0]._id,
        vet_id: merchant2._id,
        visit_date: new Date("2025-11-20"),
        diagnosis: "Khám tổng quát 6 tháng",
        treatment: "Không cần điều trị",
        notes: "Sức khỏe tốt, cân nặng ổn định",
        vaccines: [],
      },
      {
        pet_id: pets[1]._id,
        vet_id: merchant2._id,
        visit_date: new Date("2025-12-10"),
        diagnosis: "Tiêm phòng định kỳ",
        treatment: "Vaccine 7 bệnh chó + dại",
        notes: "Phản ứng bình thường",
        vaccines: ["7-in-1", "Rabies"],
      },
    ]);

    // ==================== Create Products ====================
    console.log("📦 Creating products...");
    await Product.insertMany([
      {
        merchant_id: merchant1._id,
        name: "Royal Canin Indoor",
        category: "FOOD",
        price: 450000,
        description: "Thức ăn hạt cho mèo trong nhà, ít muối, giúp kiểm soát cân nặng",
        images: [{ url: "/premium-cat-food-bag.jpg", public_id: "product_1" }],
        stock_quantity: 50,
        ai_tags: ["indoor", "low-salt", "weight-control", "cat", "adult"],
        is_active: true,
      },
      {
        merchant_id: merchant1._id,
        name: "Pate Whiskas Cá Ngừ",
        category: "FOOD",
        price: 25000,
        description: "Pate mềm cho mèo, vị cá ngừ thơm ngon",
        images: [{ url: "/cat-wet-food-can.jpg", public_id: "product_2" }],
        stock_quantity: 100,
        ai_tags: ["wet-food", "tuna", "cat", "all-ages"],
        is_active: true,
      },
      {
        merchant_id: merchant1._id,
        name: "Đồ chơi chuột bông",
        category: "TOY",
        price: 35000,
        description: "Chuột đồ chơi có chuông, kích thích bản năng săn mồi",
        images: [{ url: "/cat-mouse-toy-colorful.jpg", public_id: "product_3" }],
        stock_quantity: 80,
        ai_tags: ["toy", "interactive", "cat", "exercise"],
        is_active: true,
      },
      {
        merchant_id: merchant1._id,
        name: "Bàn cào móng cao cấp",
        category: "ACCESSORY",
        price: 280000,
        description: "Bàn cào móng kết hợp nhà nghỉ cho mèo",
        images: [{ url: "/cat-scratching-post.png", public_id: "product_4" }],
        stock_quantity: 25,
        ai_tags: ["scratching", "furniture", "cat", "claw-care"],
        is_active: true,
      },
    ]);

    // ==================== Create Services ====================
    console.log("✂️ Creating services...");
    await Service.insertMany([
      {
        merchant_id: merchant1._id,
        name: "Tắm Spa Cao Cấp",
        price_min: 200000,
        price_max: 350000,
        duration_minutes: 90,
        description: "Dịch vụ tắm spa cao cấp: tắm gội, sấy khô, cắt móng, vệ sinh tai và xịt thơm",
        image: { url: "/pet-spa-grooming.jpg", public_id: "service_1" },
        is_active: true,
      },
      {
        merchant_id: merchant1._id,
        name: "Cắt tỉa lông",
        price_min: 150000,
        price_max: 300000,
        duration_minutes: 60,
        description: "Cắt tỉa lông theo yêu cầu, tạo kiểu đẹp cho bé cưng",
        image: { url: "/pet-grooming-scissors.jpg", public_id: "service_2" },
        is_active: true,
      },
      {
        merchant_id: merchant2._id,
        name: "Khám sức khỏe định kỳ",
        price_min: 200000,
        price_max: 400000,
        duration_minutes: 30,
        description: "Khám tổng quát, kiểm tra sức khỏe toàn diện, tư vấn dinh dưỡng",
        image: { url: "/veterinary-checkup.jpg", public_id: "service_3" },
        is_active: true,
      },
      {
        merchant_id: merchant2._id,
        name: "Tiêm phòng vaccine",
        price_min: 300000,
        price_max: 500000,
        duration_minutes: 20,
        description: "Tiêm phòng vaccine đầy đủ các loại bệnh, tư vấn lịch tiêm",
        image: { url: "/pet-vaccination.jpg", public_id: "service_4" },
        is_active: true,
      },
    ]);

    // ==================== Create Packages ====================
    console.log("📋 Creating subscription packages...");
    await Package.insertMany([
      {
        name: "Gói Free",
        target_role: "CUSTOMER",
        price: 0,
        duration_months: 12,
        description: "Gói miễn phí với các tính năng cơ bản",
        features_config: {
          ai_limit_per_day: 3,
          max_pets: 1,
          priority_support: false,
        },
        is_active: true,
      },
      {
        name: "Gói Thành Viên",
        target_role: "CUSTOMER",
        price: 99000,
        duration_months: 1,
        description: "Mở khóa AI không giới hạn, lưu trữ Full HD, ưu đãi độc quyền",
        features_config: {
          ai_limit_per_day: 100,
          max_pets: 10,
          priority_support: true,
        },
        is_active: true,
      },
      {
        name: "Gói Đối Tác",
        target_role: "MERCHANT",
        price: 299000,
        duration_months: 1,
        description: "Đăng sản phẩm không giới hạn, Quét QR Y tế, Analytics nâng cao",
        features_config: {
          ai_limit_per_day: 100,
          max_pets: 0,
          priority_support: true,
          unlimited_products: true,
          qr_scanning: true,
          advanced_analytics: true,
        },
        is_active: true,
      },
    ]);

    console.log("\n✅ Seed completed successfully!");
    console.log("📊 Summary:");
    console.log(`   - Users: ${await User.countDocuments()}`);
    console.log(`   - Pets: ${await Pet.countDocuments()}`);
    console.log(`   - Medical Records: ${await MedicalRecord.countDocuments()}`);
    console.log(`   - Products: ${await Product.countDocuments()}`);
    console.log(`   - Services: ${await Service.countDocuments()}`);
    console.log(`   - Packages: ${await Package.countDocuments()}`);
    console.log("\n🔐 Demo accounts (password: 123456):");
    console.log("   - customer@tailmates.com (CUSTOMER)");
    console.log("   - merchant@tailmates.com (MERCHANT)");
    console.log("   - manager@tailmates.com (MANAGER)");
    console.log("   - admin@tailmates.com (ADMIN)");

  } catch (error) {
    console.error("❌ Seed failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n👋 Disconnected from MongoDB");
  }
}

seed();
