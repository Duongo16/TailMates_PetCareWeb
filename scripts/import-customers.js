/**
 * Import 80 customer accounts into MongoDB
 * Run: node scripts/import-customers.js
 */

const { config } = require("dotenv");
const { resolve } = require("path");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// Load .env.local
config({ path: resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not defined. Please check .env.local");
  process.exit(1);
}

async function importCustomers() {
  try {
    console.log("🚀 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Read the generated JSON
    const dataPath = path.join(process.cwd(), "customers_data.json");
    const rawData = fs.readFileSync(dataPath, "utf8");
    const customers = JSON.parse(rawData);

    // Convert $date format to actual Date objects
    const docs = customers.map((c) => ({
      ...c,
      created_at: new Date(c.created_at.$date),
      updated_at: new Date(c.updated_at.$date),
    }));

    // Get the users collection directly (bypass schema validation)
    const db = mongoose.connection.db;
    const collection = db.collection("users");

    // Insert all documents
    const result = await collection.insertMany(docs);

    console.log(`\n✅ Successfully imported ${result.insertedCount} customer accounts!`);
    console.log(`📅 Date range: 22/02/2026 → 09/03/2026 (5 accounts/day)`);

    // Show a few samples
    console.log("\n📋 Sample accounts:");
    for (let i = 0; i < 5; i++) {
      console.log(`   - ${docs[i].full_name} (${docs[i].email})`);
    }

  } catch (error) {
    console.error("❌ Import failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n👋 Disconnected from MongoDB");
  }
}

importCustomers();
