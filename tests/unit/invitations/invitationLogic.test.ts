import { describe, test, expect, vi, beforeEach } from "vitest";
import { createInvitation } from "@/app/actions/invite";
import { getDocs } from "firebase/firestore";

// Mocking Firebase infrastructure
vi.mock("@/lib/firebase", () => ({ db: {} }));
vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn(),
}));

describe("Sprint 2 - Task 2.6: Invitation Logic Unit Tests", () => {
  const mockEmail = "new.member@wits.ac.za";
  const mockGroupId = "stokvel_alpha_2026";
  const mockAdminId = "admin_aubre_01";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Token Generation Verification
  test("Should generate a unique, 36-character UUID token", async () => {
    (getDocs as any).mockResolvedValue({ empty: true });

    const res = await createInvitation(mockEmail, mockGroupId, mockAdminId);
    
    expect(res.success).toBe(true);
    // Verifies the token follows the UUID v4 pattern
    expect(res.token).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  // 2. UAT 3: Duplicate Detection (The Guardrail)
  test("UAT 3: Should fail if the email is already in the group_members collection", async () => {
    (getDocs as any).mockResolvedValue({ empty: false });

    const res = await createInvitation(mockEmail, mockGroupId, mockAdminId);

    expect(res.success).toBe(false);
    expect(res.error).toContain("already a member");
  });

  // 3. Mathematical Expiry Logic (T + 7 Days)
  test("Should set expiresAt to exactly 7 days in the future", async () => {
    (getDocs as any).mockResolvedValue({ empty: true });

    const res = await createInvitation(mockEmail, mockGroupId, mockAdminId);
    const expiryDate = new Date(res.expiresAt!);
    const now = new Date();

    const diffInDays = Math.round((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    expect(diffInDays).toBe(7);
  });
});