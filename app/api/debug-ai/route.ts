import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Use consistent environment variable name
    const apiKey = process.env.GEMINI_API_KEY

    return NextResponse.json({
      hasApiKey: !!apiKey,
      keyLength: apiKey ? apiKey.length : 0,
      keyPreview: apiKey ? `${apiKey.substring(0, 10)}...` : "Not set",
      envVarName: "GEMINI_API_KEY",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    })
  }
}

export async function POST() {
  try {
    const testUrl = "https://github.com"

    const response = await fetch(`${process.env.VERCEL_URL || "http://localhost:3000"}/api/suggestions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ link: testUrl }),
    })

    const result = await response.json()

    return NextResponse.json({
      testUrl,
      response: result,
      status: response.status,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    })
  }
}
