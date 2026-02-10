import mongoose from "mongoose";
import connectDB from "../lib/db";
import User from "../models/User";
import Transaction, { TransactionType, TransactionStatus } from "../models/Transaction";
import { generateTransactionCode } from "../lib/sepay";

async function simulateTopUp() {
  try {
    console.log("--- Starting Top-Up Simulation ---");
    await connectDB();

    // 1. Find a test user (customer or merchant)
    const user = await User.findOne({ role: { $in: ["CUSTOMER", "MERCHANT"] } });
    if (!user) {
      console.error("No test user found in database. Please register a user first.");
      process.exit(1);
    }
    console.log(`Found test user: ${user.full_name} (${user.email}) - Current Balance: ${user.tm_balance || 0} TM`);

    // 2. Create a pending transaction
    const amount = 50000; // 50,000 VND
    const transactionCode = generateTransactionCode();
    
    const transaction = await Transaction.create({
      user_id: user._id,
      type: TransactionType.TOP_UP,
      amount: amount,
      transaction_code: transactionCode,
      status: TransactionStatus.PENDING,
      expire_at: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
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

    console.log("\n--- Dispatching Webhook Call ---");
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
      const updatedUser = await User.findById(user._id);
      console.log(`\n--- Verification ---`);
      console.log(`Updated Balance: ${updatedUser?.tm_balance} TM`);
      console.log(`Difference: ${Number(updatedUser?.tm_balance || 0) - Number(user.tm_balance || 0)} TM`);
      
      if (updatedUser?.tm_balance === (user.tm_balance || 0) + amount) {
        console.log("SUCCESS: Balance updated correctly!");
      } else {
        console.log("FAILED: Balance mismatch.");
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
