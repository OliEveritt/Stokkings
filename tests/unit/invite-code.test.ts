import { describe, it, expect } from "vitest";
import {
  generateInviteCode,
  normalizeInviteCode,
  INVITE_CODE_REGEX,
} from "@/lib/invite-code";

describe("invite-code", () => {
  it("generates a code in the XXXX-XXXX format", () => {
    const code = generateInviteCode();
    expect(code).toMatch(INVITE_CODE_REGEX);
    expect(code).toHaveLength(9);
  });

  it("never uses ambiguous characters (0, O, 1, I, L)", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateInviteCode();
      expect(code).not.toMatch(/[01ILO]/);
    }
  });

  it("produces unique codes across many generations", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i++) seen.add(generateInviteCode());
    expect(seen.size).toBeGreaterThan(990);
  });

  it("is deterministic given fixed bytes", () => {
    const fixed = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(generateInviteCode(fixed)).toBe(generateInviteCode(fixed));
  });

  it("normalizes user input (trims, uppercases, removes spaces)", () => {
    expect(normalizeInviteCode("  ab2c-de3f  ")).toBe("AB2C-DE3F");
    expect(normalizeInviteCode("ab 2c-de 3f")).toBe("AB2C-DE3F");
  });
});
