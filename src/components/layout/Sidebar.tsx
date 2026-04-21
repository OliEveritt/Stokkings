"use client";

import { X, Shield, ChevronRight } from "lucide-react";
import type { NavItem, Rates } from "@/types";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
  rates,
  onClose,
  showClose,
}: {
  items: NavItem[];
  rates: Rates;
  onClose?: () => void;
  showClose?: boolean;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* 1. Brand Identity */}
      <div className="flex items-center justify-between px-6 h-20 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-100">
            <Shield size={20} className="text-white" />
          </div>
          <span className="font-black text-gray-900 text-xl tracking-tighter">
            Stokkings
          </span>
        </div>
        {showClose && (
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        )}
      </div>

      {/* 2. Navigation Ledger */}
      <nav className="flex-1 overflow-y-auto py-8 px-4 space-y-8">
        <div>
          <p className="px-4 mb-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
            Financial Menu
          </p>
          <div className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              
              // RECONCILIATION LOGIC: 
              // Map 'dashboard' to root and 'invitations' to the GeneralTest ID
              let href = item.href || `/${item.id}`;
              if (item.id === "dashboard") href = "/";
              if (item.id === "invitations") href = "/groups/5OH8mq7aM4oPJVSdJ7Zo/invite";

              const isActive = pathname === href;

              return (
                <Link
                  key={item.id}
                  href={href}
                  onClick={onClose}
                  className={`group flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${
                    isActive
                      ? "bg-gray-900 text-white shadow-xl shadow-gray-200"
                      : "text-gray-500 hover:bg-emerald-50 hover:text-emerald-700"
                  }`}
                >
                  <Icon 
                    size={18} 
                    className={`${isActive ? "text-emerald-400" : "text-gray-400 group-hover:text-emerald-500"} transition-colors`} 
                  />
                  <span className="flex-1">{item.label}</span>
                  {isActive && <ChevronRight size={14} className="text-gray-400" />}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* 3. Economic Indicators (SARB Data) */}
      <div className="p-6">
        <div className="bg-gray-900 rounded-[2rem] p-5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full -mr-12 -mt-12" />
          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3">
            Market Rates
          </p>
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <span className="text-[10px] text-gray-400 font-bold uppercase">Repo Rate</span>
              <span className="text-lg font-black text-white">{rates.repo}%</span>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-[10px] text-gray-400 font-bold uppercase">Prime Lending</span>
              <span className="text-lg font-black text-white">{rates.prime}%</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
            <span className="text-[8px] text-gray-500 font-bold uppercase italic">Source: SARB</span>
            <span className="text-[8px] text-gray-500 font-bold">{rates.updated}</span>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Sidebar(props: SidebarProps) {
  if (props.mobile) {
    return (
      <div className="fixed inset-0 z-50 flex lg:hidden">
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md" onClick={props.onClose} />
        <div className="relative w-80 bg-white flex flex-col h-full z-50 animate-in slide-in-from-left duration-500">
          <SidebarContent {...props} showClose />
        </div>
      </div>
    );
  }

  return (
    <div className="hidden lg:flex flex-col w-72 shrink-0 bg-white border-r border-gray-100 h-full">
      <SidebarContent {...props} />
    </div>
  );
}