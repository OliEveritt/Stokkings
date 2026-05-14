/**
 * US-3.6: Edit Profile Information
 * US-4.3: Meeting Notifications — notification bell with badge and dropdown
 * Header component with dropdown menu containing Edit Profile option
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { Menu, User as UserIcon, LogOut, ChevronDown, UserCircle, Bell } from "lucide-react";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import type { User, Notification, Role } from "@/types";
import EditProfileModal from "@/components/profile/EditProfileModal";
import { useNotifications } from "@/hooks/useNotifications";

interface Mandate {
  group_id: number;
  group_name: string;
  role_name: string;
}

interface HeaderProps {
  user: User & { group_id?: number };
  groupName: string;
  activeLabel: string;
  notifications?: Notification[];
  roleOverride?: Role;
  mandates?: Mandate[];
  onMandateSwitch?: (groupId: number) => void;
  onRoleChange?: (role: Role) => void;
  onOpenMobileSidebar: () => void;
}

export default function Header({ 
  user, 
  groupName, 
  activeLabel, 
  onOpenMobileSidebar,
}: HeaderProps) {
  const { logout, refreshUser } = useFirebaseAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const { notifications, unreadCount, markAsRead } = useNotifications();

  // Close notification panel when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    const isConfirmed = window.confirm("Are you sure you want to sign out?");
    if (isConfirmed) {
      await logout();
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/login";
    }
  };

  const handleEditProfile = () => {
    setIsDropdownOpen(false);
    setIsEditModalOpen(true);
  };

  const handleProfileUpdated = async () => {
    await refreshUser();
  };

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  const handleDropdownBlur = (e: React.FocusEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDropdownOpen(false);
    }
  };

  const handleNotifOpen = () => setIsNotifOpen((prev) => !prev);
  const handleMarkAllRead = async () => await markAsRead();

  return (
    <>
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 shrink-0 shadow-sm relative z-30">
        <div className="flex items-center gap-4">
          <button onClick={onOpenMobileSidebar} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
            <Menu size={20} />
          </button>
          
          <div className="hidden lg:block">
            <h1 className="text-lg font-semibold text-gray-800">{activeLabel}</h1>
            <p className="text-xs text-gray-500">{groupName}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">

          {/* UAT 3: Notification Bell with Badge */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={handleNotifOpen}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Notifications"
            >
              <Bell size={20} className="text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {/* UAT 3 & 4: Notification Dropdown Panel */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-400 text-sm">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => markAsRead(notif.id)}
                        className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${
                          !notif.read ? "bg-emerald-50" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                            !notif.read ? "bg-emerald-500" : "bg-gray-200"
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm leading-relaxed ${
                              !notif.read ? "text-gray-800 font-medium" : "text-gray-600"
                            }`}>
                              {notif.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {notif.createdAt?.seconds
                                ? new Date(notif.createdAt.seconds * 1000).toLocaleString("en-ZA", {
                                    day: "numeric",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "Just now"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
          
          <div className="relative" onBlur={handleDropdownBlur}>
            <button
              onClick={toggleDropdown}
              className="flex items-center gap-2 pl-2 border-l border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <UserIcon size={16} className="text-emerald-600" />
              </div>
              <div className="hidden md:block text-sm text-left">
                <p className="font-medium text-gray-800">{user.name}</p>
                <p className="text-xs text-gray-500">{user.role}</p>
              </div>
              <ChevronDown size={14} className={`text-gray-400 hidden md:block transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                
                <button
                  onClick={handleEditProfile}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <UserCircle size={16} />
                  Edit Profile
                </button>
                
                <div className="border-t border-gray-100 my-1"></div>
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onProfileUpdated={handleProfileUpdated}
      />
    </>
  );
}