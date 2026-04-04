"use client";

import { Settings, LogOut, ChevronDown } from "lucide-react";
import { RoleBadge } from "@/components/ui/Badge";
import type { User } from "@/types";

interface UserMenuProps {
  user: User;
  open: boolean;
  onToggle: () => void;
}

export function UserMenu({ user, open, onToggle }: UserMenuProps) {
  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 p-1.5 pr-3 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
          {initials}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-gray-800 leading-tight">
            {user.name}
          </p>
          <p className="text-xs text-gray-400 leading-tight">{user.group}</p>
        </div>
        <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-800">{user.name}</p>
            <p className="text-xs text-gray-400">{user.email}</p>
            <div className="mt-1.5">
              <RoleBadge role={user.role} />
            </div>
          </div>
          <div className="py-1">
            <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
              <Settings size={15} /> Account Settings
            </button>
            <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
