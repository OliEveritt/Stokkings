"use client";

import { X, Shield, ChevronRight } from "lucide-react";
import type { NavItem, Rates } from "@/types";

interface SidebarProps {
  items: NavItem[];
  active: string;
  onNav: (id: string) => void;
  rates: Rates;
  mobile?: boolean;
  onClose?: () => void;
}

function SidebarContent({
  items,
  active,
  onNav,
  rates,
  onClose,
  showClose,
}: {
  items: NavItem[];
  active: string;
  onNav: (id: string) => void;
  rates: Rates;
  onClose?: () => void;
  showClose?: boolean;
}) {
  return (
    <>
      {/* 1. Header & Logo Section */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
            <Shield size={16} className="text-white" />
          </div>
          <span className="font-bold text-gray-800 text-base tracking-tight">
            Stokkings
          </span>
        </div>
        {showClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X size={20} className="text-gray-500" />
          </button>
        )}
      </div>

      {/* 2. Primary Navigation Ledger */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <p className="px-3 mb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
          Navigation
        </p>
        <div className="space-y-0.5">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === active;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNav(item.id);
                  onClose?.();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon size={18} className={isActive ? "text-emerald-600" : "text-gray-400"} />
                <span className="flex-1 text-left">{item.label}</span>
                {isActive && <ChevronRight size={14} className="text-emerald-400" />}
              </button>
            );
          })}
        </div>
      </nav>

      {/* 3. Economic Indicators (Rates) */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-3.5 border border-emerald-100">
          <p className="text-xs font-semibold text-emerald-800 mb-1">
            SA Interest Rates
          </p>
          <div className="flex justify-between text-xs text-emerald-700">
            <span>Repo: <strong>{rates.repo}%</strong></span>
            <span>Prime: <strong>{rates.prime}%</strong></span>
          </div>
          <p className="text-[10px] text-emerald-500 mt-1.5">
            SARB &middot; Updated {rates.updated}
          </p>
        </div>
      </div>
    </>
  );
}

// THE MAIN EXPORT (Default)
export default function Sidebar({
  items,
  active,
  onNav,
  rates,
  mobile,
  onClose,
}: SidebarProps) {
  if (mobile) {
    return (
      <div className="fixed inset-0 z-50 flex lg:hidden">
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-72 max-w-[80vw] bg-white flex flex-col h-full shadow-2xl z-50 animate-in slide-in-from-left duration-300">
          <SidebarContent
            items={items}
            active={activePage}
            onNav={onNav}
            rates={rates}
            onClose={onClose}
            showClose
          />
        </div>
      </div>
    );
  }

  return (
    <div className="hidden lg:flex flex-col w-64 shrink-0 bg-white border-r border-gray-200 h-full">
      <SidebarContent items={items} active={active} onNav={onNav} rates={rates} />
    </div>
  );
}