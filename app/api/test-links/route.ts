import { NextResponse } from "next/server"
import { saveLink, getAllLinks, getLinkBySlug, deleteLink } from "../../actions/link-actions"
import type { LinkItem } from "../../../types"

export async function GET() {
  try {
    console.log("Testing link operations...")

    // Test 1: Get all links
    const allLinksResult = await getAllLinks()
    console.log("Get all links result:", allLinksResult)

    // Test 2: Try to get a specific link
    const testSlug = "github"
    const linkResult = await getLinkBySlug(testSlug)
    console.log(`Get link by slug (${testSlug}) result:`, linkResult)

    // Test 3: Create a test link
    const testLink: LinkItem = {
      id: crypto.randomUUID(),
      url: "https://test.example.com",
      slug: "test-" + Date.now(),
      title: "Test Link",
      createdAt: new Date(),
    }

    const saveResult = await saveLink(testLink)
    console.log("Save test link result:", saveResult)

    // Test 4: Clean up test link
    if (saveResult.success) {
      const deleteResult = await deleteLink(testLink.id)
      console.log("Delete test link result:", deleteResult)
    }

    return NextResponse.json({
      success: true,
      tests: {
        getAllLinks: allLinksResult,
        getLinkBySlug: linkResult,
        saveLink: saveResult,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Test API error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    })
  }
}
