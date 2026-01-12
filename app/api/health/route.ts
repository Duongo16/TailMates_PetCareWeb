import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import mongoose from "mongoose";

export async function GET() {
  try {
    // Attempt to connect to MongoDB
    await connectDB();

    // Check connection state
    const connectionState = mongoose.connection.readyState;
    const stateMap: Record<number, string> = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };

    // Get database stats
    const db = mongoose.connection.db;
    let dbStats = null;
    
    if (db) {
      dbStats = await db.command({ ping: 1 });
    }

    return NextResponse.json({
      success: true,
      message: "MongoDB connection is healthy! 🎉",
      status: stateMap[connectionState] || "unknown",
      database: mongoose.connection.name,
      host: mongoose.connection.host,
      ping: dbStats?.ok === 1 ? "OK" : "FAILED",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check failed:", error);
    
    return NextResponse.json(
      {
        success: false,
        message: "MongoDB connection failed",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
