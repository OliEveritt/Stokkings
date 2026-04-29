const API_NINJAS_URL =
  "https://api.api-ninjas.com/v1/interestrate?country=South_Africa";

const API_KEY = process.env.API_NINJAS_KEY ?? "";

/** SA banks' fixed margin above repo rate */
const PRIME_SPREAD = 3.5;

export interface SarbRates {
  repo: number;
  prime: number;
  updatedAt: Date;
}

interface ApiNinjasResponse {
  central_bank_rates: {
    central_bank: string;
    country: string;
    rate_pct: number;
    last_updated: string;
  }[];
}

export async function fetchSarbRates(): Promise<SarbRates> {
  const response = await fetch(API_NINJAS_URL, {
   ers: { "X-Api-Key": API_KEY },
  });

  if (!response.ok) {
    throw new Error(
      `API Ninjas request failed with status ${response.status} ${response.statusText}`
    );
  }

  const data: ApiNinjasResponse = await response.json();
  const saRate = data.central_bank_rates?.find(
    (r) => r.country === "South_Africa"
  );

  if (!saRate) {
    throw new Error("South Africa rate not found in API response");
  }

  const repo = saRate.rate_pct;

  return {
    repo,
    prime: Math.round((repo + PRIME_SPREAD) * 100) / 100,
    updatedAt: new Date(),
  };
}
