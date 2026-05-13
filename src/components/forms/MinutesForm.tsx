"use client";

import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Toast } from "@/components/ui/Toast";
// Import the validator and input type
import { MeetingValidator, MeetingInput } from "@/validators/meeting.validator";

interface MinutesFormProps {
  meetingId: string;
  initialMinutes: string;
  meetingDate: string; // Pass the meeting date for validation
  groupId: string;     // Pass the groupId for validation
  agenda: string;      // Pass the agenda for validation
}

export default function MinutesForm({ 
  meetingId, 
  initialMinutes, 
  meetingDate, 
  groupId, 
  agenda 
}: MinutesFormProps) {
  const [minutes, setMinutes] = useState(initialMinutes);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error"; visible: boolean }>({
    message: "",
    type: "success",
    visible: false,
  });

  const triggerToast = (message: string, type: "success" | "error") => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3000);
  };

  const handleSave = async () => {
    // 1. Prepare data for validation
    const input: MeetingInput = {
      groupId,
      date: meetingDate,
      agenda,
      minutes
    };

    // 2. Run Validation (Mid-sprint change: isRecordingMinutes = true)
    const validation = MeetingValidator.validateMeetingInput(input, Date.now(), true);

    if (!validation.isValid) {
      triggerToast(validation.errors[0], "error");
      return;
    }

    setIsSaving(true);
    try {
      const meetingRef = doc(db, "meetings", meetingId);
      await updateDoc(meetingRef, {
        minutes: minutes,
        updatedAt: new Date().toISOString(),
      });
      
      triggerToast("Minutes updated successfully", "success");
      setIsEditing(false);
      window.location.reload(); 

    } catch (error) {
      console.error("Error updating minutes:", error);
      triggerToast("Failed to update minutes", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Card>
        <div className="space-y-4">
          {!isEditing ? (
            <div>
              <div className="prose max-w-none text-gray-700 min-h-[100px]">
                {minutes ? (
                  <p className="whitespace-pre-wrap">{minutes}</p>
                ) : (
                  <p className="italic text-gray-400">No minutes recorded. Click edit to add them.</p>
                )}
              </div>
              <div className="mt-4 border-t pt-4">
                <Button onClick={() => setIsEditing(true)} variant="secondary" size="sm">
                  Edit Minutes
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <textarea
                className="w-full min-h-[300px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-800 outline-none transition-all"
                placeholder="Record the meeting discussions, decisions, and action items here..."
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                disabled={isSaving}
              />
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setMinutes(initialMinutes);
                    setIsEditing(false);
                  }}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving || minutes === initialMinutes}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isSaving ? <LoadingSpinner /> : "Save Minutes"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Toast 
        message={toast.message} 
        type={toast.type} 
        visible={toast.visible} 
      />
    </>
  );
}