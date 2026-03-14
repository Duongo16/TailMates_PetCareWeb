const { config } = require("dotenv");
const { resolve } = require("path");
const mongoose = require("mongoose");

config({ path: resolve(process.cwd(), ".env.local") });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const collection = db.collection("users");
  
  // Count users per day in Feb 2026
  const users = await collection.find({
    role: "CUSTOMER",
    created_at: {
      $gte: new Date("2026-02-01T00:00:00Z"),
      $lte: new Date("2026-03-15T00:00:00Z")
    }
  }).sort({ created_at: 1 }).toArray();

  console.log(`Total CUSTOMER users in Feb-Mar 2026: ${users.length}\n`);
  
  // Group by date (UTC)
  const dailyCounts = {};
  users.forEach(u => {
    const dateKey = u.created_at.toISOString().split('T')[0];
    if (!dailyCounts[dateKey]) dailyCounts[dateKey] = 0;
    dailyCounts[dateKey]++;
  });
  
  console.log("=== Users per day (UTC date) ===");
  Object.keys(dailyCounts).sort().forEach(date => {
    console.log(`  ${date}: ${dailyCounts[date]} users`);
  });

  // Show first 5 users with their dates  
  console.log("\n=== Sample users from batch 2 (02/02 range) ===");
  const feb2Users = users.filter(u => u.created_at < new Date("2026-02-13T00:00:00Z"));
  feb2Users.slice(0, 5).forEach(u => {
    console.log(`  ${u.full_name} | created_at: ${u.created_at.toISOString()} | UTC date: ${u.created_at.toISOString().split('T')[0]}`);
  });

  await mongoose.disconnect();
}

check();
