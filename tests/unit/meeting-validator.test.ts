import { describe, it, expect } from "vitest";
import { validateMeetingInput } from "@/validators/meeting.validator";

const NOW = new Date("2026-05-09T12:00:00");

describe("validateMeetingInput", () => {
  it("accepts a valid future meeting", () => {
    const result = validateMeetingInput(
      { groupId: "g1", date: "2026-06-01", time: "14:30", agenda: "Quarterly review" },
      NOW
    );
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual({});
  });

  it("rejects missing groupId / date / time / agenda", () => {
    const result = validateMeetingInput({}, NOW);
    expect(result.ok).toBe(false);
    expect(result.errors).toHaveProperty("groupId");
    expect(result.errors).toHaveProperty("date");
    expect(result.errors).toHaveProperty("time");
    expect(result.errors).toHaveProperty("agenda");
  });

  it("rejects a meeting in the past (UAT 3)", () => {
    const result = validateMeetingInput(
      { groupId: "g1", date: "2026-05-08", time: "10:00", agenda: "Old meeting" },
      NOW
    );
    expect(result.ok).toBe(false);
    expect(result.errors.date).toMatch(/future/i);
  });

  it("rejects a meeting scheduled for now or earlier today", () => {
    const result = validateMeetingInput(
      { groupId: "g1", date: "2026-05-09", time: "12:00", agenda: "Right now" },
      NOW
    );
    expect(result.ok).toBe(false);
    expect(result.errors.date).toMatch(/future/i);
  });

  it("rejects malformed dates and times", () => {
    expect(
      validateMeetingInput({ groupId: "g1", date: "not-a-date", time: "14:00", agenda: "x" }, NOW).ok
    ).toBe(false);
    expect(
      validateMeetingInput({ groupId: "g1", date: "2026-06-01", time: "14h", agenda: "x" }, NOW).ok
    ).toBe(false);
  });

  it("rejects too-short agenda", () => {
    const result = validateMeetingInput(
      { groupId: "g1", date: "2026-06-01", time: "14:00", agenda: "ok" },
      NOW
    );
    expect(result.ok).toBe(false);
    expect(result.errors.agenda).toMatch(/3 characters/i);
  });
});
