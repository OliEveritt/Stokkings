import { useState, useEffect, useRef } from "react";
import type { Rates } from "@/types";

const FALLBACK_RATES: Rates = { repo: 0, prime: 0, updated: "" };

// Global cache outside the hook (persists across remounts)
let cachedRates: Rates | null = null;
let fetchPromise: Promise<Rates> | null = null;

export function useRates() {
  const [rates, setRates] = useState<Rates>(cachedRates || FALLBACK_RATES);
  const [loading, setLoading] = useState(!cachedRates);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    // If we already have cached rates, don't fetch
    if (cachedRates) {
      setLoading(false);
      return;
    }

    // If a fetch is already in progress, use that promise
    if (!fetchPromise) {
      fetchPromise = fetch("/api/rates")
        .then(res => {
          if (!res.ok) throw new Error("Failed to fetch rates");
          return res.json() as Promise<Rates>;
        })
        .then(data => {
          cachedRates = data;
          return data;
        })
        .catch(err => {
          fetchPromise = null;
          throw err;
        });
    }

    fetchPromise
      .then(data => {
        if (isMounted.current) {
          setRates(data);
          setError(null);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted.current) {
          setError(err.message);
          setLoading(false);
        }
      });
  }, []); // still only runs once per component mount

  return { rates, loading, error };
}