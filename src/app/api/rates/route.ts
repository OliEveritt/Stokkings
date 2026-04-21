import { NextResponse } from "next/server";

// Fallback rates if API fails
const FALLBACK_RATES = {
  repo: 7.75,
  prime: 11.25,
};

export async function GET() {
  try {
    // Try to fetch from a public SARB data source
    // For now, return mock data that updates daily
    const response = await fetch('https://api.api-ninjas.com/v1/interestrate?country=South_Africa', {
      headers: {
        'X-Api-Key': process.env.API_NINJAS_KEY || '',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        repo: data.repo_rate || FALLBACK_RATES.repo,
        prime: data.prime_rate || FALLBACK_RATES.prime,
        updated: new Date().toLocaleDateString(),
      });
    }

    // Fallback to cached or default rates
    return NextResponse.json({
      repo: FALLBACK_RATES.repo,
      prime: FALLBACK_RATES.prime,
      updated: new Date().toLocaleDateString(),
    });
  } catch (error) {
    console.error('Rate fetch error:', error);
    return NextResponse.json({
      repo: FALLBACK_RATES.repo,
      prime: FALLBACK_RATES.prime,
      updated: new Date().toLocaleDateString(),
    });
  }
}
