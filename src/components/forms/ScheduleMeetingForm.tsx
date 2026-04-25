"use client";

import { useState } from "react";
import { CalendarDays, MapPin, Clock } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

export default function ScheduleMeetingForm({ groupId }: { groupId: string }) {
  const [meeting, setMeeting] = useState({ date: "", time: "", location: "" });

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, "meetings"), {
      groupId,
      ...meeting,
      status: "scheduled",
      createdAt: new Date().toISOString()
    });
    alert("Meeting scheduled!");
    setMeeting({ date: "", time: "", location: "" });
  };

  return (
    <form onSubmit={handleSchedule} className="space-y-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Schedule Meeting</h3>
      
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-[10px] font-bold text-gray-400 ml-1">DATE</label>
          <div className="relative">
            <CalendarDays className="absolute left-3 top-2.5 text-gray-300" size={16} />
            <input type="date" className="w-full pl-10 pr-3 py-2 rounded-lg bg-gray-50 border-none text-sm" value={meeting.date} onChange={(e) => setMeeting({...meeting, date: e.target.value})} required/>
          </div>
        </div>
        <div className="flex-1">
          <label className="text-[10px] font-bold text-gray-400 ml-1">TIME</label>
          <div className="relative">
            <Clock className="absolute left-3 top-2.5 text-gray-300" size={16} />
            <input type="time" className="w-full pl-10 pr-3 py-2 rounded-lg bg-gray-50 border-none text-sm" value={meeting.time} onChange={(e) => setMeeting({...meeting, time: e.target.value})} required/>
          </div>
        </div>
      </div>

      <div>
        <label className="text-[10px] font-bold text-gray-400 ml-1">LOCATION / LINK</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-2.5 text-gray-300" size={16} />
          <input type="text" placeholder="e.g. Zoom or Physical Address" className="w-full pl-10 pr-3 py-2 rounded-lg bg-gray-50 border-none text-sm" value={meeting.location} onChange={(e) => setMeeting({...meeting, location: e.target.value})} required/>
        </div>
      </div>

      <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors">
        Confirm Meeting
      </button>
    </form>
  );
}