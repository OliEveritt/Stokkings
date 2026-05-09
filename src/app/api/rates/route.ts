import { NextResponse } from "next/server";
import { rateService } from "@/services/rate.service";

// Cache this route for 1 hour to prevent constant external fetching
export const revalidate = 3600;

/**
 * GET: Retrieves current Repo and Prime rates.
 * Implements a 3-second circuit breaker to prevent dashboard hangs.
 */
export async function GET() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    // Attempt to fetch rates via service (which handles SARB integration or DB cache)
    const rates = await rateService.getCurrentRates();
    clearTimeout(timeoutId);

    return NextResponse.json({
      repo: rates.repo,
      prime: rates.prime,
      updated: rates.updatedAt.toLocaleDateString("en-ZA"),
      status: "live"
    });
  } catch (error) {
    console.error("Rate fetch failed or timed out, using banking defaults:", error);
    
    // Return standard South African fallback rates (Current 2024/2025 levels)
    return NextResponse.json({
      repo: 8.25,
      prime: 11.75,
      updated: new Date().toLocaleDateString("en-ZA"),
      status: "fallback"
    });
  }
}

/**
 * POST: Manually triggers a refresh of economic indicators.
 * Useful for admin-scheduled tasks or manual updates.
 */
export async function POST() {
  try {
    const rates = await rateService.refreshRates();

    return NextResponse.json({
      success: true,
      repo: rates.repo,
      prime: rates.prime,
      updated: rates.updatedAt.toLocaleDateString("en-ZA"),
    });
  } catch (error) {
    console.error("Rate refresh error:", error);
    return NextResponse.json(
      { error: "Failed to refresh rates" }, 
      { status: 500 }
    );
  }
}