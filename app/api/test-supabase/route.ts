import { NextResponse } from "next/server"
import { testSupabaseConnection, isSupabaseAvailable, getSupabaseError } from "../../../lib/supabase"

export async function GET() {
  try {
    console.log("Testing Supabase connection...")

    if (!isSupabaseAvailable()) {
      const error = getSupabaseError()
      return NextResponse.json({
        success: false,
        error: "Supabase not configured",
        details: error,
        timestamp: new Date().toISOString(),
      })
    }

    const result = await testSupabaseConnection()

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
