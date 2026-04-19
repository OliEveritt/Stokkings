"use client";

import { useState, useMemo, useCallback, useEffect, useContext } from "react";
import {
  Home, Users, Wallet, Calendar, BarChart3, Settings,
  CreditCard, UserPlus, CircleDollarSign,
} from "lucide-react";

import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import RatesBanner from "@/components/layout/RatesBanner";
import { getActiveMembership, getAllUserMandates } from "./actions";
import { useRates } from "@/hooks/useRates";
import { AuthCtx } from "@/context/auth-context";
import type { User, Notification, NavItem, Role } from "@/types";

interface Mandate {
  group_id: number;
  group_name: string;
  role_name: string;
}

const MOCK_NOTIFS: Notification[] = [
  { id: 1, text: "Contribution confirmed — R500", time: "2h ago", read: false },
];

const NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: Home, roles: ["Member", "Treasurer", "Admin"], path: "/dashboard" },
  { id: "payments", label: "Payments", icon: CreditCard, roles: ["Member", "Treasurer", "Admin"], path: "/payments" },
  { id: "payouts", label: "Payout Schedule", icon: CircleDollarSign, roles: ["Treasurer", "Admin"], path: "/payouts" },
  { id: "meetings", label: "Meetings", icon: Calendar, roles: ["Member", "Treasurer", "Admin"], path: "/meetings" },
  { id: "analytics", label: "Analytics", icon: BarChart3, roles: ["Treasurer", "Admin"], path: "/analytics" },
  { id: "members", label: "Members", icon: Users, roles: ["Admin"], path: "/members" },
  { id: "contributions", label: "Contributions", icon: CreditCard, roles: ["Member", "Treasurer", "Admin"], path: "/contributions" },
  { id: "create-group", label: "Create Group", icon: Users, roles: ["Admin"], path: "/create-group" },
  { id: "invitations", label: "Invitations", icon: UserPlus, roles: ["Admin"], path: "/invitations" },
 
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User & { group_id?: number }>({
    name: "Loading...",
    email: "",
    avatar: null,
    group: "Fetching...",
    role: "Member",
  });
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const { rates, loading: ratesLoading } = useRates();
  const [activePage, setActivePage] = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [roleOverride, setRoleOverride] = useState<Role>("Member");

  useEffect(() => {
    async function syncLedger() {
      try {
        const membership = await getActiveMembership();
        if (membership) {
          setUser({
            name: `${membership.first_name} ${membership.surname}`,
            email: membership.email,
            avatar: null,
            group: membership.group_name,
            group_id: membership.group_id,
            role: membership.role_name as Role,
          });
          setRoleOverride(membership.role_name as Role);
        }
        const allMandates = await getAllUserMandates();
        setMandates(allMandates);
      } catch (err) {
        console.error("Ledger Sync Failure:", err);
      }
    }
    syncLedger();
  }, []);

  const handleMandateSwitch = useCallback(async (newGroupId: number) => {
    const selected = mandates.find(m => m.group_id === newGroupId);
    if (selected) {
      setUser(prev => ({
        ...prev,
        group: selected.group_name,
        group_id: selected.group_id,
        role: selected.role_name as Role,
      }));
      setRoleOverride(selected.role_name as Role);
    }
  }, [mandates]);

  const visibleNav = useMemo(
    () => NAV.filter((n) => n.roles.includes(roleOverride)),
    [roleOverride]
  );

  const activeLabel = NAV.find((n) => n.id === activePage)?.label || "Dashboard";

  const handleNav = useCallback((id: string) => {
    setActivePage(id);
    setMobileOpen(false);
  }, []);

  const handleRoleChange = useCallback((role: Role) => {
    setRoleOverride(role);
    setActivePage("dashboard");
  }, []);

  return (
    <AuthCtx.Provider value={{ ...user, role: roleOverride }}>
      <div className="h-screen flex flex-col bg-gray-50 overflow-hidden font-sans">
        {!ratesLoading && <RatesBanner rates={rates} />}

        <Header
          user={user}
          groupName={user.group}
          activeLabel={activeLabel}
          notifications={MOCK_NOTIFS}
          roleOverride={roleOverride}
          mandates={mandates}
          onMandateSwitch={handleMandateSwitch}
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
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="fixed inset-0 bg-gray-600/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
              <Sidebar
                items={visibleNav}
                active={activePage}
                onNav={handleNav}
                rates={rates}
                mobile
                onClose={() => setMobileOpen(false)}
              />
            </div>
          )}

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
