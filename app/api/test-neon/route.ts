import { NextResponse } from "next/server"
import { testNeonConnection, checkTablesExist, ensureTablesExist } from "../../../lib/neon"

export async function GET() {
  try {
    console.log("Testing Neon database connection...")

    // Test connection
    const connectionResult = await testNeonConnection()

    if (!connectionResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: connectionResult.error,
          details: connectionResult.details,
          timestamp: new Date().toISOString(),
        },
        { status: 500 },
      )
    }

    // Check if tables exist
    const tablesResult = await checkTablesExist()

    let setupResult = null
    if (!tablesResult.success) {
      console.log("Tables missing, attempting to create them...")
      setupResult = await ensureTablesExist()
    }

    return NextResponse.json({
      success: true,
      connection: "OK",
      details: {
        ...connectionResult.details,
        tablesCheck: tablesResult,
        autoSetup: setupResult,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Neon test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Test failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
