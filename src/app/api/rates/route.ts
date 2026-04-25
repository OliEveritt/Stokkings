import { NextResponse } from "next/server";
import { fetchSarbRates } from "@/lib/sarb-client";

export async function GET() {
  try {
    const rates = await fetchSarbRates();

    return NextResponse.json({
      repo: rates.repo,
      prime: rates.prime,
      updated: new Date().toLocaleDateString(),
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
