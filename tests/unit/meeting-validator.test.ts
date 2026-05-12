import { describe, it, expect } from "vitest";
// Import the class and the NOW constant logic
import { MeetingValidator } from "@/validators/meeting.validator";

const NOW_MS = new Date("2026-05-09T12:00:00").getTime();

describe("MeetingValidator.validateMeetingInput", () => {
  
  it("accepts a valid future meeting", () => {
    const result = MeetingValidator.validateMeetingInput(
      { groupId: "g1", date: "2026-06-01", agenda: "Quarterly review", minutes: "" },
      NOW_MS,
      false
    );
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it("rejects missing groupId and short agenda", () => {
    // Testing the logic where groupId is missing and agenda is < 5 chars
    const result = MeetingValidator.validateMeetingInput(
      { groupId: "", date: "2026-06-01", agenda: "No", minutes: "" },
      NOW_MS,
      false
    );
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Group ID is required.");
    expect(result.errors).toContain("Agenda must be at least 5 characters long.");
  });

  it("rejects a meeting in the past for new schedules", () => {
    const result = MeetingValidator.validateMeetingInput(
      { groupId: "g1", date: "2026-05-08", agenda: "Old meeting", minutes: "" },
      NOW_MS,
      false
    );
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toMatch(/future date/i);
  });

  // MID-SPRINT CHANGE TEST (UAT 1 & 3)
  it("allows a past date when specifically recording minutes", () => {
    const result = MeetingValidator.validateMeetingInput(
      { 
        groupId: "g1", 
        date: "2026-05-08", // Yesterday relative to NOW_MS
        agenda: "Past meeting",
        minutes: "We discussed the budget." 
      },
      NOW_MS,
      true // isRecordingMinutes = true
    );
    
    expect(result.isValid).toBe(true);
  });

  it("rejects empty minutes when finalizing a meeting", () => {
    const result = MeetingValidator.validateMeetingInput(
      { 
        groupId: "g1", 
        date: "2026-05-08", 
        agenda: "Past meeting",
        minutes: "" // Empty minutes while flag is true
      },
      NOW_MS,
      true
    );
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Minutes cannot be empty when finalizing a meeting.");
  });
});