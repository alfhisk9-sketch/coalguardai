import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    service: "CoalGuard AI",
    environment: process.env.NODE_ENV || "production",
  });
}
