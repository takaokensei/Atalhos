import { NextResponse } from "next/server"
import { testNeonConnection, isNeonAvailable, getNeonError } from "../../../lib/neon"

export async function GET() {
  try {
    console.log("Testing Neon connection...")

    if (!isNeonAvailable()) {
      const error = getNeonError()
      return NextResponse.json({
        success: false,
        error: "Neon not configured",
        details: error,
        timestamp: new Date().toISOString(),
      })
    }

    const result = await testNeonConnection()

    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Test API error:", error)
    return NextResponse.json({
      success: false,
      error: "Test failed",
      details: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    })
  }
}
