import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { validateMeeting } from "@/validators/meeting.validator";

const FUTURE_DATE = "2099-12-31";
const PAST_DATE = "2000-01-01";
const VALID_TIME = "14:00";
const VALID_AGENDA = "Discuss monthly savings and plan next payout";

describe("validateMeeting", () => {
  describe("date validation", () => {
    it("returns error when date is missing", () => {
      const result = validateMeeting({ date: "", time: VALID_TIME, agenda: VALID_AGENDA });
      expect(result.valid).toBe(false);
      expect(result.errors.date).toBeDefined();
    });

    it("returns error when date is in the past (UAT 3)", () => {
      const result = validateMeeting({ date: PAST_DATE, time: VALID_TIME, agenda: VALID_AGENDA });
      expect(result.valid).toBe(false);
      expect(result.errors.date).toMatch(/past/i);
    });

    it("returns error for invalid date format", () => {
      const result = validateMeeting({ date: "not-a-date", time: VALID_TIME, agenda: VALID_AGENDA });
      expect(result.valid).toBe(false);
      expect(result.errors.date).toBeDefined();
    });

    it("accepts today's date", () => {
      const today = new Date().toISOString().split("T")[0];
      const result = validateMeeting({ date: today, time: VALID_TIME, agenda: VALID_AGENDA });
      expect(result.errors.date).toBeUndefined();
    });

    it("accepts a future date", () => {
      const result = validateMeeting({ date: FUTURE_DATE, time: VALID_TIME, agenda: VALID_AGENDA });
      expect(result.errors.date).toBeUndefined();
    });
  });

  describe("time validation", () => {
    it("returns error when time is missing", () => {
      const result = validateMeeting({ date: FUTURE_DATE, time: "", agenda: VALID_AGENDA });
      expect(result.valid).toBe(false);
      expect(result.errors.time).toBeDefined();
    });

    it("returns error for invalid time format", () => {
      const result = validateMeeting({ date: FUTURE_DATE, time: "9am", agenda: VALID_AGENDA });
      expect(result.valid).toBe(false);
      expect(result.errors.time).toBeDefined();
    });

    it("accepts valid HH:MM time", () => {
      const result = validateMeeting({ date: FUTURE_DATE, time: "09:30", agenda: VALID_AGENDA });
      expect(result.errors.time).toBeUndefined();
    });
  });

  describe("agenda validation", () => {
    it("returns error when agenda is missing", () => {
      const result = validateMeeting({ date: FUTURE_DATE, time: VALID_TIME, agenda: "" });
      expect(result.valid).toBe(false);
      expect(result.errors.agenda).toBeDefined();
    });

    it("returns error when agenda is only whitespace", () => {
      const result = validateMeeting({ date: FUTURE_DATE, time: VALID_TIME, agenda: "   " });
      expect(result.valid).toBe(false);
      expect(result.errors.agenda).toBeDefined();
    });

    it("returns error when agenda is too short", () => {
      const result = validateMeeting({ date: FUTURE_DATE, time: VALID_TIME, agenda: "Short" });
      expect(result.valid).toBe(false);
      expect(result.errors.agenda).toMatch(/10 characters/i);
    });

    it("accepts a valid agenda", () => {
      const result = validateMeeting({ date: FUTURE_DATE, time: VALID_TIME, agenda: VALID_AGENDA });
      expect(result.errors.agenda).toBeUndefined();
    });
  });

  describe("full validation", () => {
    it("returns valid when all fields are correct (UAT 1)", () => {
      const result = validateMeeting({ date: FUTURE_DATE, time: VALID_TIME, agenda: VALID_AGENDA });
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it("returns multiple errors when multiple fields are invalid", () => {
      const result = validateMeeting({ date: PAST_DATE, time: "", agenda: "" });
      expect(result.valid).toBe(false);
      expect(Object.keys(result.errors).length).toBeGreaterThan(1);
    });
  });
});
