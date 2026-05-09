"use client";

import { X, Shield } from "lucide-react";
import Link from "next/link";
import type { NavItem, Rates } from "@/types";

/**
 * Enhanced SidebarProps to resolve ts(2339) errors.
 * Includes optional currentGroupId and mobile-specific handlers.
 */
interface SidebarProps {
  items: NavItem[];
  active: string;
  onNav: (id: string) => void;
  rates: Rates | null;
  mobileOpen: boolean; 
  setMobileOpen: (open: boolean) => void;
  currentGroupId?: string | null; // Fixed: Property now exists for US-2.1
}

/**
 * Interface for internal content wrapper
 */
interface SidebarContentProps extends SidebarProps {
  showClose?: boolean;
  onClose?: () => void;
}

function SidebarContent({ 
  items, 
  active, 
  onNav, 
  currentGroupId, 
  onClose, 
  showClose 
}: SidebarContentProps) {
  return (
    <>
      {/* Branding Section */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-100 rounded-lg">
            <Shield className="text-emerald-600" size={18} />
          </div>
          <span className="font-black text-gray-900 tracking-tight">Stokkings</span>
        </div>
        {showClose && (
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        {items.map((item: NavItem) => {
          const Icon = item.icon;
          const isActive = item.id === active;

          // US-2.1: Navigation for Invitation Management Handshake
          if (item.id === "invitations") {
            return (
              <Link
                key={item.id}
                href={currentGroupId ? `/groups/${currentGroupId}/invite` : '/invitations'}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                  isActive 
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100" 
                    : "text-gray-400 hover:bg-gray-50 hover:text-emerald-600"
                }`}
                onClick={() => {
                  if (showClose && onClose) onClose();
                }}
              >
                <Icon size={18} />
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          }

          // Default internal navigation for dashboard sections
          return (
            <button
              key={item.id}
              onClick={() => {
                onNav(item.id);
                if (showClose && onClose) onClose(); 
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                isActive 
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100" 
                  : "text-gray-400 hover:bg-gray-50 hover:text-emerald-600"
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
  const { mobileOpen, setMobileOpen } = props;

  return (
    <>
      {/* Desktop View: Fixed Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-gray-100 h-full">
        <SidebarContent {...props} />
      </aside>

      {/* Mobile View: Slide-over Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] flex lg:hidden">
          {/* Backdrop Overlay */}
          <div 
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300" 
            onClick={() => setMobileOpen(false)} 
          />
          
          {/* Drawer Panel */}
          <div className="relative w-72 bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-500">
            <SidebarContent 
              {...props} 
              showClose 
              onClose={() => setMobileOpen(false)} 
            />
          </div>
        </div>
      )}
    </>
  );
}