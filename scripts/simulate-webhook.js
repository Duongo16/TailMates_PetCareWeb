const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load env vars from .env.local
dotenv.config({ path: path.join(__dirname, "../.env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

// Mock Schema definitions for quick access
const UserSchema = new mongoose.Schema({
  email: String,
  full_name: String,
  role: String,
  tm_balance: { type: Number, default: 0 }
});

const TransactionSchema = new mongoose.Schema({
  user_id: mongoose.Schema.Types.ObjectId,
  type: String,
  amount: Number,
  transaction_code: String,
  status: String,
  expire_at: Date
});

const User = mongoose.model("TestUser", UserSchema, "users");
const Transaction = mongoose.model("TestTransaction", TransactionSchema, "transactions");

async function simulateTopUp() {
  try {
    console.log("--- Starting Top-Up Simulation (JS) ---");
    if (!MONGODB_URI) {
      console.error("MONGODB_URI not found in .env.local");
      process.exit(1);
    }

    await mongoose.connect(MONGODB_URI);

    // 1. Find a test user
    const user = await User.findOne({ role: { $in: ["customer", "merchant", "CUSTOMER", "MERCHANT"] } });
    if (!user) {
      console.error("No test user found in database. Please register a user first.");
      process.exit(1);
    }
    console.log(`Found test user: ${user.full_name} (${user.email}) - Current Balance: ${user.tm_balance || 0} TM`);

    // 2. Create a pending transaction
    const amount = 50000;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let transactionCode = "TM";
    for (let i = 0; i < 6; i++) {
      transactionCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const transaction = await Transaction.create({
      user_id: user._id,
      type: "TOP_UP",
      amount: amount,
      transaction_code: transactionCode,
      status: "PENDING",
      expire_at: new Date(Date.now() + 15 * 60 * 1000)
    });

    console.log(`Created pending transaction: ${transactionCode} for ${amount} VND`);

    // 3. Construct SePay Webhook Payload
    const payload = {
      gateway: "TPBank",
      transactionDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
      accountNumber: process.env.SEPAY_ACCOUNT_NUMBER || "00000119563",
      subAccount: "TEST",
      code: null,
      content: `TKPTM2 ${transactionCode}`,
      transferType: "in",
      description: `Test simulation for ${transactionCode}`,
      transferAmount: amount,
      referenceCode: "TEST_REF_" + Math.random().toString(36).substring(7),
      accumulated: (user.tm_balance || 0) + amount,
      id: Math.floor(Math.random() * 100000000)
    };

    console.log("\n--- Dispatching Webhook Call locally ---");
    // Use dynamic import for fetch for Node compatibility if needed, or assume Node 18+
    const response = await fetch("http://localhost:3000/api/v1/payment/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    console.log("Webhook Response:", result);

    if (response.ok) {
      // 4. Verify balance update
      // Small delay to ensure DB write
      await new Promise(r => setTimeout(r, 1000));
      const updatedUser = await User.findById(user._id);
      console.log(`\n--- Verification ---`);
      console.log(`Updated Balance: ${updatedUser.tm_balance} TM`);
      console.log(`Difference: ${updatedUser.tm_balance - (user.tm_balance || 0)} TM`);
      
      if (updatedUser.tm_balance === (user.tm_balance || 0) + amount) {
        console.log("SUCCESS: Balance updated correctly!");
      } else {
        console.log("FAILED: Balance mismatch. Current balance in DB: " + updatedUser.tm_balance);
      }
    } else {
      console.error("Webhook call failed.");
    }

  } catch (error) {
    console.error("Simulation error:", error);
  } finally {
    mongoose.connection.close();
  }
}

simulateTopUp();
