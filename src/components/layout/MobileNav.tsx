"use client";

import { Menu, Shield } from "lucide-react";

interface MobileNavProps {
  onOpenSidebar: () => void;
}

export function MobileNav({ onOpenSidebar }: MobileNavProps) {
  return (
    <div className="flex items-center gap-3 lg:hidden">
      <button
        onClick={onOpenSidebar}
        className="p-2 rounded-lg hover:bg-gray-100"
      >
        <Menu size={20} className="text-gray-600" />
      </button>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <Shield size={13} className="text-white" />
        </div>
        <span className="font-bold text-gray-800 text-sm">Stokkings</span>
      </div>
    </div>
  );
}
