import { NextResponse } from "next/server";
import { rateService } from "@/services/rate.service";

export async function GET() {
  try {
    const rates = await rateService.getCurrentRates();

    return NextResponse.json({
      repo: rates.repo,
      prime: rates.prime,
      updated: rates.updatedAt.toLocaleDateString(),
    });
  } catch (error) {
    console.error("Rate fetch error:", error);

    return NextResponse.json({
      repo: 7.75,
      prime: 11.25,
      updated: new Date().toLocaleDateString(),
    });
  }
}

export async function POST() {
  try {
    const rates = await rateService.refreshRates();

    return NextResponse.json({
      success: true,
      repo: rates.repo,
      prime: rates.prime,
      updated: rates.updatedAt.toLocaleDateString(),
    });
  } catch (error) {
    console.error("Rate refresh error:", error);
    return NextResponse.json({ error: "Failed to refresh rates" }, { status: 500 });
  }
}
