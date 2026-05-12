"use client";

import { useState } from "react";
import { CalendarDays, Clock, FileText, Loader2 } from "lucide-react";
import { auth } from "@/lib/firebase";
// Updated: Import the Class and Input Interface
import { MeetingValidator, MeetingInput } from "@/validators/meeting.validator";

interface ScheduleMeetingFormProps {
  groupId: string;
  onScheduled?: (meetingId: string) => void;
}

export default function ScheduleMeetingForm({ groupId, onScheduled }: ScheduleMeetingFormProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [agenda, setAgenda] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]); // Refined for ValidationResult
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setSuccess(null);
    setErrors([]);

    // 1. Construct input object matching the UML Interface
    const input: MeetingInput = {
      groupId,
      date,
      agenda,
      minutes: "", // Not recorded during initial scheduling
    };

    // 2. Implementation of Mid-Sprint Change: 
    // isRecordingMinutes is FALSE here, enforcing the "future date only" rule.
    const validation = MeetingValidator.validateMeetingInput(input, Date.now(), false);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    const fbUser = auth.currentUser;
    if (!fbUser) {
      setServerError("You must be signed in.");
      return;
    }

    setLoading(true);
    try {
      const token = await fbUser.getIdToken();
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ groupId, date, time, agenda }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error || "Failed to schedule meeting");
        return;
      }
      
      setSuccess("Meeting scheduled.");
      setDate("");
      setTime("");
      setAgenda("");
      onScheduled?.(data.id);
    } catch (err) {
      console.error(err);
      setServerError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm w-full max-w-none">
      <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-2">
        Schedule Meeting
      </h3>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase tracking-wider">Date</label>
          <div className="relative mt-1">
            <CalendarDays className="absolute left-3 top-3 text-gray-300" size={16} />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full pl-10 pr-3 py-2 rounded-lg bg-gray-50 border border-transparent focus:border-emerald-500 outline-none text-sm"
              required
            />
          </div>
        </div>
        <div className="flex-1">
          <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase tracking-wider">Time</label>
          <div className="relative mt-1">
            <Clock className="absolute left-3 top-3 text-gray-300" size={16} />
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full pl-10 pr-3 py-2 rounded-lg bg-gray-50 border border-transparent focus:border-emerald-500 outline-none text-sm"
              required
            />
          </div>
        </div>
      </div>

      <div>
        <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase tracking-wider">Agenda</label>
        <div className="relative mt-1">
          <FileText className="absolute left-3 top-3 text-gray-300" size={16} />
          <textarea
            value={agenda}
            onChange={(e) => setAgenda(e.target.value)}
            rows={4}
            placeholder="What will be discussed?"
            className="w-full pl-10 pr-3 py-2 rounded-lg bg-gray-50 border border-transparent focus:border-emerald-500 outline-none text-sm"
            required
          />
        </div>
      </div>

      {/* Validation Errors Display */}
      {errors.length > 0 && (
        <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs space-y-1">
          {errors.map((err, i) => <p key={i}>• {err}</p>)}
        </div>
      )}

      {serverError && (
        <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm">{serverError}</div>
      )}
      {success && (
        <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm">{success}</div>
      )}

      <button
        disabled={loading}
        className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 disabled:opacity-50 transition-all"
      >
        {loading ? <Loader2 className="animate-spin" /> : "Confirm Meeting"}
      </button>
    </form>
  );
}