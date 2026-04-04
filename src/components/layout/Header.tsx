"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { MobileNav } from "./MobileNav";
import { UserMenu } from "./UserMenu";
import type { User, Notification, Role } from "@/types";

interface NotificationDropdownProps {
  notifs: Notification[];
  open: boolean;
  onToggle: () => void;
}

function NotificationDropdown({
  notifs,
  open,
  onToggle,
}: NotificationDropdownProps) {
  const unread = notifs.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} className="text-gray-600" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="font-semibold text-sm text-gray-800">
              Notifications
            </span>
            {unread > 0 && (
              <span className="text-xs text-blue-600 cursor-pointer hover:underline">
                Mark all read
              </span>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notifs.map((n) => (
              <div
                key={n.id}
                className={`px-4 py-3 border-b border-gray-50 last:border-0 ${
                  n.read ? "opacity-60" : "bg-blue-50/40"
                }`}
              >
                <p className="text-sm text-gray-800">{n.text}</p>
                <p className="text-xs text-gray-400 mt-1">{n.time}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface HeaderProps {
  user: User;
  groupName: string;
  activeLabel: string;
  notifications: Notification[];
  roleOverride: Role;
  onRoleChange: (role: Role) => void;
  onOpenMobileSidebar: () => void;
}

export function Header({
  user,
  groupName,
  activeLabel,
  notifications,
  roleOverride,
  onRoleChange,
  onOpenMobileSidebar,
}: HeaderProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const closeAll = () => {
    setNotifOpen(false);
    setUserMenuOpen(false);
  };

  return (
    <header
      className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0"
      onClick={closeAll}
    >
      <div className="flex items-center gap-3">
        <MobileNav onOpenSidebar={onOpenMobileSidebar} />
        <span className="hidden lg:block text-sm text-gray-400">
          {groupName}{" "}
          <span className="mx-1.5 text-gray-300">/</span>{" "}
          <span className="text-gray-700 font-medium">{activeLabel}</span>
        </span>
      </div>

      <div
        className="flex items-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        <select
          value={roleOverride}
          onChange={(e) => onRoleChange(e.target.value as Role)}
          className="text-xs border border-dashed border-gray-300 rounded-lg px-2 py-1.5 mr-2 text-gray-500 bg-gray-50 focus:outline-none"
        >
          <option value="Admin">View as: Admin</option>
          <option value="Treasurer">View as: Treasurer</option>
          <option value="Member">View as: Member</option>
        </select>
        <NotificationDropdown
          notifs={notifications}
          open={notifOpen}
          onToggle={() => {
            setNotifOpen(!notifOpen);
            setUserMenuOpen(false);
          }}
        />
        <UserMenu
          user={{ ...user, role: roleOverride }}
          open={userMenuOpen}
          onToggle={() => {
            setUserMenuOpen(!userMenuOpen);
            setNotifOpen(false);
          }}
        />
      </div>
    </header>
  );
}
