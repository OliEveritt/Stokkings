"use client";

import { useState, useMemo, useCallback, createContext, useContext } from "react";
import {
  Home, Users, Wallet, Calendar, BarChart3, Settings,
  CreditCard, UserPlus, CircleDollarSign,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { RatesBanner } from "@/components/layout/RatesBanner";
import { useRates } from "@/hooks/useRates";
import type { User, Notification, NavItem, Role } from "@/types";

const MOCK_USER: User = {
  name: "Thando Nkosi",
  email: "thando@example.com",
  avatar: null,
  role: "Admin",
  group: "Umoja Savings Club",
};

const MOCK_NOTIFS: Notification[] = [
  { id: 1, text: "Contribution confirmed — R500", time: "2h ago", read: false },
  { id: 2, text: "Meeting scheduled for Apr 10", time: "5h ago", read: false },
  { id: 3, text: "Sipho missed March contribution", time: "1d ago", read: true },
];

const NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: Home, roles: ["Member", "Treasurer", "Admin"], path: "/dashboard" },
  { id: "contributions", label: "Contributions", icon: Wallet, roles: ["Member", "Treasurer", "Admin"], path: "/contributions" },
  { id: "payments", label: "Payments", icon: CreditCard, roles: ["Member", "Treasurer", "Admin"], path: "/payments" },
  { id: "payouts", label: "Payout Schedule", icon: CircleDollarSign, roles: ["Treasurer", "Admin"], path: "/payouts" },
  { id: "meetings", label: "Meetings", icon: Calendar, roles: ["Member", "Treasurer", "Admin"], path: "/meetings" },
  { id: "analytics", label: "Analytics", icon: BarChart3, roles: ["Treasurer", "Admin"], path: "/analytics" },
  { id: "members", label: "Members", icon: Users, roles: ["Admin"], path: "/members" },
  { id: "invitations", label: "Invitations", icon: UserPlus, roles: ["Admin"], path: "/invitations" },
  { id: "group", label: "Group Settings", icon: Settings, roles: ["Admin"], path: "/group/settings" },
];

interface AuthContextValue extends User {
  role: Role;
}

const AuthCtx = createContext<AuthContextValue | null>(null);
export const useAuth = () => useContext(AuthCtx);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user] = useState<User>(MOCK_USER);
  const { rates, loading: ratesLoading } = useRates();
  const [activePage, setActivePage] = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [roleOverride, setRoleOverride] = useState<Role>(user.role);

  const visibleNav = useMemo(
    () => NAV.filter((n) => n.roles.includes(roleOverride)),
    [roleOverride]
  );

  const activeLabel = NAV.find((n) => n.id === activePage)?.label || "Page";

  const handleNav = useCallback((id: string) => {
    setActivePage(id);
  }, []);

  const handleRoleChange = useCallback((role: Role) => {
    setRoleOverride(role);
    setActivePage("dashboard");
  }, []);

  return (
    <AuthCtx.Provider value={{ ...user, role: roleOverride }}>
      <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
        {!ratesLoading && <RatesBanner rates={rates} />}
        <Header
          user={user}
          groupName={user.group}
          activeLabel={activeLabel}
          notifications={MOCK_NOTIFS}
          roleOverride={roleOverride}
          onRoleChange={handleRoleChange}
          onOpenMobileSidebar={() => setMobileOpen(true)}
        />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            items={visibleNav}
            active={activePage}
            onNav={handleNav}
            rates={rates}
          />
          {mobileOpen && (
            <Sidebar
              items={visibleNav}
              active={activePage}
              onNav={handleNav}
              rates={rates}
              mobile
              onClose={() => setMobileOpen(false)}
            />
          )}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </AuthCtx.Provider>
  );
}
