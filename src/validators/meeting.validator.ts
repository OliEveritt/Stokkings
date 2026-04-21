export interface MeetingInput {
  date: string;
  time: string;
  agenda: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateMeeting(input: MeetingInput): ValidationResult {
  const errors: Record<string, string> = {};

  if (!input.date) {
    errors.date = "Date is required";
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const meetingDate = new Date(input.date);
    if (isNaN(meetingDate.getTime())) {
      errors.date = "Invalid date format";
    } else if (meetingDate < today) {
      errors.date = "Meeting date cannot be in the past";
    }
  }

  if (!input.time) {
    errors.time = "Time is required";
  } else if (!/^\d{2}:\d{2}$/.test(input.time)) {
    errors.time = "Invalid time format (HH:MM expected)";
  }

  if (!input.agenda || input.agenda.trim().length === 0) {
    errors.agenda = "Agenda is required";
  } else if (input.agenda.trim().length < 10) {
    errors.agenda = "Agenda must be at least 10 characters";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
