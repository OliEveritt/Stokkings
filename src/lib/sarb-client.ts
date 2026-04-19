/** SA banks' fixed margin above repo rate */
const PRIME_SPREAD = 3.5;

export interface SarbRates {
  repo: number;
  prime: number;
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
  const url = "https://api.api-ninjas.com/v1/interestrate?country=South_Africa";
  const apiKey = process.env.API_NINJAS_KEY ?? "";

  const response = await fetch(url, {
    headers: { "X-Api-Key": apiKey },
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
  };
}
