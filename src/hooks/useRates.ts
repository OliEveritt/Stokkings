import { useState, useEffect } from "react";
import type { Rates } from "@/types";

const FALLBACK_RATES: Rates = { repo: 0, prime: 0, updated: "" };

export function useRates() {
  const [rates, setRates] = useState<Rates>(FALLBACK_RATES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchRates() {
      try {
        const res = await fetch("/api/rates");
        if (!res.ok) throw new Error("Failed to fetch rates");
        const data: Rates = await res.json();
        if (!cancelled) {
          setRates(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchRates();
    return () => { cancelled = true; };
  }, []);

  return { rates, loading, error };
}
