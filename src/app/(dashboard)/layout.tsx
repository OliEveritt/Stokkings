"use client";

import { useState, useMemo, useCallback, createContext, useContext, useEffect } from "react";
import {
  Home, Users, Wallet, Calendar, BarChart3, Settings,
  CreditCard, UserPlus, CircleDollarSign,
} from "lucide-react";

import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import RatesBanner from "@/components/layout/RatesBanner";
import { getActiveMembership, getAllUserMandates } from "./actions"; // Added getAllUserMandates
import type { User, Notification, Rates, NavItem, Role } from "@/types";

// --- RECONCILED TYPES ---
interface AuthContextValue extends User {
  role: Role;
  group_id?: number; 
}

// Define the Mandate shape for the switcher
interface Mandate {
  group_id: number;
  group_name: string;
  role_name: string;
}

const AuthCtx = createContext<AuthContextValue | null>(null);
export const useAuth = () => useContext(AuthCtx);

const MOCK_RATES: Rates = { repo: 8.25, prime: 11.75, updated: "2026-04-08" };
const MOCK_NOTIFS: Notification[] = [
  { id: 1, text: "Contribution confirmed — R500", time: "2h ago", read: false },
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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User & { group_id?: number }>({
    name: "Loading...",
    email: "",
    avatar: null,
    group: "Fetching...", 
    role: "Member",
  });
  
  // 1. ADD MANDATES STATE: To hold Thabo's 14+ group list
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [activePage, setActivePage] = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [roleOverride, setRoleOverride] = useState<Role>("Member");

  // 2. DYNAMIC SYNC: Pulling identity and switcher data
  useEffect(() => {
    async function syncLedger() {
      try {
        // Fetch identity first
        const membership = await getActiveMembership();
        if (membership) {
          setUser({
            name: `${membership.first_name} ${membership.surname}`,
            email: membership.email,
            avatar: null,
            group: membership.group_name,
            group_id: membership.group_id,
            role: membership.role_name as Role
          });
          setRoleOverride(membership.role_name as Role);
        }

        // Fetch the full mandate list for the dropdown
        const allMandates = await getAllUserMandates();
        setMandates(allMandates);
      } catch (err) {
        console.error("Ledger Sync Failure:", err);
      }
    }
    syncLedger();
  }, []);

  // 3. MANDATE SWITCHER LOGIC: Handles the dropdown click
  const handleMandateSwitch = useCallback(async (newGroupId: number) => {
    // We fetch specific data for the newly selected group
    // For now, we can filter our existing mandates or re-fetch active membership
    const selected = mandates.find(m => m.group_id === newGroupId);
    if (selected) {
      setUser(prev => ({
        ...prev,
        group: selected.group_name,
        group_id: selected.group_id,
        role: selected.role_name as Role
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
        <RatesBanner rates={MOCK_RATES} />

        <Header
          user={user}
          groupName={user.group}
          activeLabel={activeLabel}
          notifications={MOCK_NOTIFS}
          roleOverride={roleOverride}
          mandates={mandates} // Pass the real SQL list here
          onMandateSwitch={handleMandateSwitch} // Pass the switcher function
          onRoleChange={handleRoleChange}
          onOpenMobileSidebar={() => setMobileOpen(true)}
        />

        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            items={visibleNav}
            active={activePage}
            onNav={handleNav}
            rates={MOCK_RATES}
          />

          {mobileOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="fixed inset-0 bg-gray-600/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
              <Sidebar
                items={visibleNav}
                active={activePage}
                onNav={handleNav}
                rates={MOCK_RATES}
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