import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchSarbRates } from "@/lib/sarb-client";

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe("fetchSarbRates", () => {
  const validResponse = {
    central_bank_rates: [
      {
        central_bank: "South African Central Bank",
        country: "South_Africa",
        rate_pct: 6.75,
        last_updated: "11-20-2025",
      },
    ],
  };

  it("should fetch and return repo rate, and derive prime as repo + 3.5%", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(validResponse),
    });

    const rates = await fetchSarbRates();

    expect(rates).toEqual({ repo: 6.75, prime: 10.25 });
  });

  it("should call the API Ninjas interest rate endpoint with correct headers", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(validResponse),
    });

    await fetchSarbRates();

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("api-ninjas.com");
    expect(url).toContain("South_Africa");
    expect(options.headers).toHaveProperty("X-Api-Key");
  });

  it("should throw when the HTTP response is not ok", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: "Forbidden",
    });

    await expect(fetchSarbRates()).rejects.toThrow(/failed/i);
  });

  it("should throw when fetch itself rejects (network error)", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    await expect(fetchSarbRates()).rejects.toThrow("Network error");
  });

  it("should throw when South Africa rate is not in the response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          central_bank_rates: [
            { country: "United_States", rate_pct: 3.75 },
          ],
        }),
    });

    await expect(fetchSarbRates()).rejects.toThrow(/not found/i);
  });

  it("should throw when central_bank_rates array is empty", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ central_bank_rates: [] }),
    });

    await expect(fetchSarbRates()).rejects.toThrow(/not found/i);
  });

  it("should return numbers, not strings", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(validResponse),
    });

    const rates = await fetchSarbRates();

    expect(typeof rates.repo).toBe("number");
    expect(typeof rates.prime).toBe("number");
  });

  it("should correctly calculate prime for different repo values", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          central_bank_rates: [
            { country: "South_Africa", rate_pct: 8.0 },
          ],
        }),
    });

    const rates = await fetchSarbRates();

    expect(rates.repo).toBe(8);
    expect(rates.prime).toBe(11.5);
  });
});
