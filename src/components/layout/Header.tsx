"use client";

import { Bell, Menu, User as UserIcon, LogOut, ChevronDown, Building2 } from "lucide-react";
import { logout } from "@/app/(auth)/actions";
import type { User, Notification, Role } from "@/types";

interface Mandate {
  group_id: number;
  group_name: string;
  role_name: string;
}

interface HeaderProps {
  user: User & { group_id?: number }; // Ensure type consistency for the check
  groupName: string;
  activeLabel: string;
  notifications: Notification[];
  roleOverride: Role;
  mandates: Mandate[]; 
  onMandateSwitch: (groupId: number) => void; 
  onRoleChange: (role: Role) => void;
  onOpenMobileSidebar: () => void;
}

export default function Header({
  user,
  groupName,
  activeLabel,
  notifications,
  roleOverride,
  mandates = [], // 1. Added a default value fallback here
  onMandateSwitch,
  onRoleChange,
  onOpenMobileSidebar,
}: HeaderProps) {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 shrink-0 shadow-sm relative z-30">
      <div className="flex items-center gap-4">
        <button onClick={onOpenMobileSidebar} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
          <Menu size={20} />
        </button>
        
        <div className="flex flex-col">
          <h1 className="text-sm font-medium text-gray-500 leading-none mb-1">{activeLabel}</h1>
          <div className="relative group cursor-pointer">
            <div className="flex items-center gap-1.5 text-emerald-600">
              <Building2 size={14} />
              <span className="text-sm font-bold tracking-tight">{groupName}</span>
              <ChevronDown size={14} className="group-hover:translate-y-0.5 transition-transform" />
            </div>

            {/* DYNAMIC DROPDOWN */}
            <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-100 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all p-2 z-50">
              <p className="text-[10px] font-bold text-gray-400 uppercase px-3 py-2 tracking-widest">Switch Mandate</p>
              
              {/* 2. Used optional chaining and fallback for total liquidity */}
              {mandates?.length > 0 ? (
                mandates.map((m) => (
                  <button 
                    key={m.group_id}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
                      m.group_id === user.group_id ? "bg-emerald-50 text-emerald-700" : "hover:bg-gray-50 text-gray-600"
                    }`}
                    onClick={() => onMandateSwitch(m.group_id)}
                  >
                    <div className="font-bold">{m.group_name}</div>
                    <div className="text-[10px] opacity-70 italic">{m.role_name}</div>
                  </button>
                ))
              ) : (
                <p className="text-xs text-gray-400 px-3 py-2 italic">Loading mandates...</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-6">
        {/* ... Identical User Identity Section ... */}
        <div className="flex items-center gap-4 pl-4 border-l border-gray-100">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-gray-900 leading-none">{user.name}</p>
            <p className="text-[10px] text-emerald-500 font-bold uppercase mt-1">Active: {roleOverride}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 border border-emerald-200 shadow-sm">
            <UserIcon size={18} />
          </div>
          <button onClick={() => logout()} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}