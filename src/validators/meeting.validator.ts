export interface MeetingInput {
  groupId: string;
  date: string;
  agenda: string;
  minutes: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class MeetingValidator {
  /**
   * Validates meeting input data.
   * Mid-sprint change: isRecordingMinutes flag bypasses the "future date only" rule.
   */
  static validateMeetingInput(
    input: MeetingInput,
    now: number = Date.now(),
    isRecordingMinutes: boolean = false
  ): ValidationResult {
    const errors: string[] = [];

    // Basic validation
    if (!input.groupId) errors.push("Group ID is required.");
    if (!input.agenda || input.agenda.trim().length < 5) {
      errors.push("Agenda must be at least 5 characters long.");
    }

    // Date validation logic
    const selectedDate = new Date(input.date).getTime();
    
    // MID-SPRINT CHANGE LOGIC:
    // When scheduling a NEW meeting, date must be in the future.
    // When recording minutes, we allow past dates.
    if (!isRecordingMinutes && selectedDate < now) {
      errors.push("New meetings must be scheduled for a future date.");
    }

    if (isRecordingMinutes && (!input.minutes || input.minutes.trim().length === 0)) {
      errors.push("Minutes cannot be empty when finalizing a meeting.");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}