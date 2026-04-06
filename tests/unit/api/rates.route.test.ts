import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the service module before importing the route
vi.mock("@/services/rate.service", () => {
  const mockGetLatestRates = vi.fn();
  return {
    RateService: vi.fn().mockImplementation(() => ({
      getLatestRates: mockGetLatestRates,
    })),
    mockGetLatestRates,
  };
});

// Mock the repository and sarb-client so the route module can construct dependencies
vi.mock("@/repositories/rate.repository", () => ({
  RateRepository: vi.fn(),
}));

vi.mock("@/lib/sarb-client", () => ({
  fetchSarbRates: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {},
}));

import { GET } from "@/app/api/rates/route";

// Access the shared mock function
const { mockGetLatestRates } = await import("@/services/rate.service") as any;

describe("GET /api/rates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 200 with rates on success", async () => {
    const ratesData = {
      repo: 8.25,
      prime: 11.75,
      updated: "2026-04-05T10:00:00.000Z",
    };
    mockGetLatestRates.mockResolvedValueOnce(ratesData);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(ratesData);
  });

  it("should return 500 when service throws an error", async () => {
    mockGetLatestRates.mockRejectedValueOnce(
      new Error("Unable to retrieve rates")
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toHaveProperty("error");
  });
});
