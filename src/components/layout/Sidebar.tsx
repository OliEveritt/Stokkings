"use client";

import { X, Shield } from "lucide-react";
import type { NavItem, Rates } from "@/types";

interface SidebarProps {
  items: NavItem[];
  active: string;
  onNav: (id: string) => void;
  rates: Rates;
  currentGroupId: string;
  mobile?: boolean;
  onClose?: () => void;
}

// Added explicit Interface for Content to resolve "any" warnings
interface SidebarContentProps extends SidebarProps {
  showClose?: boolean;
}

function SidebarContent({
  items,
  active,
  onNav,
  onClose,
  showClose
}: SidebarContentProps) {
  return (
    <>
      <div className="flex items-center justify-between px-5 h-16 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Shield className="text-emerald-600" size={20} />
          <span className="font-bold text-gray-800">Stokkings</span>
        </div>
        {showClose && (
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition">
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {items.map((item: NavItem) => {
          const Icon = item.icon;
          const isActive = item.id === active;

          // Default internal state navigation for dashboard sections
          return (
            <button
              key={item.id}
              onClick={() => {
                onNav(item.id);
                if (showClose && onClose) onClose(); // Auto-close mobile drawer on nav
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive 
                  ? "bg-emerald-50 text-emerald-700 shadow-sm" 
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon size={18} />
              <span className="flex-1 text-left">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

export default function Sidebar(props: SidebarProps) {
  if (props.mobile) {
    return (
      <div className="fixed inset-0 z-50 flex lg:hidden">
        <div 
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" 
          onClick={props.onClose} 
        />
        <div className="relative w-64 bg-white h-full shadow-2xl flex flex-col">
          <SidebarContent {...props} showClose />
        </div>
      </div>
    );
  }

  return (
    <div className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 h-full">
      <SidebarContent {...props} />
    </div>
  );
}