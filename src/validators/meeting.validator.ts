export interface MeetingInput {
  groupId?: string;
  date?: string; // YYYY-MM-DD
  time?: string; // HH:MM
  agenda?: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: Record<string, string>;
}

export function combineDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time}`);
}

export function validateMeetingInput(
  input: MeetingInput,
  now: Date = new Date(),
  isRecordingMinutes: boolean = false // Added flag for TDD pass
): ValidationResult {
  const errors: Record<string, string> = {};

  if (!input.groupId || typeof input.groupId !== "string" || !input.groupId.trim()) {
    errors.groupId = "Group is required";
  }
  if (!input.date || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    errors.date = "Valid date is required";
  }
  if (!input.time || !/^\d{2}:\d{2}$/.test(input.time)) {
    errors.time = "Valid time is required";
  }
  if (!input.agenda || !input.agenda.trim()) {
    errors.agenda = "Agenda is required";
  } else if (input.agenda.trim().length < 3) {
    errors.agenda = "Agenda must be at least 3 characters";
  }

  if (!errors.date && !errors.time && input.date && input.time) {
    const scheduled = combineDateTime(input.date, input.time);
    if (Number.isNaN(scheduled.getTime())) {
      errors.date = "Invalid date/time";
    } else if (!isRecordingMinutes && scheduled.getTime() <= now.getTime()) {
      errors.date = "Meeting must be scheduled for a future date and time";
    }
  }

  return { ok: Object.keys(errors).length === 0, errors };
}
