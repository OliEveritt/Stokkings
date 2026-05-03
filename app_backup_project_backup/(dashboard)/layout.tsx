"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Home, Users, Calendar, BarChart3, CreditCard, 
  UserPlus, CircleDollarSign, TrendingUp, ClipboardList,
} from "lucide-react";

import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import RatesBanner from "@/components/layout/RatesBanner";
import { useRates } from "@/hooks/useRates";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import type { User, Notification, NavItem, Role } from "@/types";

const NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: Home, roles: ["Member", "Treasurer", "Admin"], path: "/dashboard" },
  { id: "payments", label: "Payments", icon: CreditCard, roles: ["Member", "Treasurer", "Admin"], path: "/payments" },
  { id: "payouts", label: "Payout Schedule", icon: CircleDollarSign, roles: ["Treasurer", "Admin"], path: "/payouts" },
  { id: "meetings", label: "Meetings", icon: Calendar, roles: ["Member", "Treasurer", "Admin"], path: "/meetings" },
  { id: "analytics", label: "Analytics", icon: BarChart3, roles: ["Treasurer", "Admin"], path: "/analytics" },
  { id: "manage-contributions", label: "Manage Contributions", icon: ClipboardList, roles: ["Treasurer", "Admin"], path: "/manage-contributions" },
  { id: "members", label: "Members", icon: Users, roles: ["Admin"], path: "/members" },
  { id: "contributions", label: "My Contributions", icon: CreditCard, roles: ["Member", "Treasurer", "Admin"], path: "/contributions" },
  { id: "savings-projection", label: "Savings Projection", icon: TrendingUp, roles: ["Member", "Treasurer", "Admin"], path: "/savings-projection" },
  { id: "invitations", label: "Invitations", icon: UserPlus, roles: ["Admin"], path: "/invitations" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user: firebaseUser, loading: authLoading } = useFirebaseAuth();
  const router = useRouter();
  const params = useParams();
  
  // FIXED: Capture ID based on common folder naming conventions
  const currentGroupId = (params.groupId || params.id) as string;

  const { rates, loading: ratesLoading } = useRates();
  const [activePage, setActivePage] = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);

  const user: User = {
    name: firebaseUser?.name || "User",
    email: firebaseUser?.email || "",
    avatar: null,
    group: "Stokvel Group",
    role: (firebaseUser?.role as Role) || "Member",
  };

  const visibleNav = useMemo(
    () => NAV.filter((n) => n.roles.includes(user.role)),
    [user.role]
  );

  const handleNav = useCallback((id: string) => {
    const navItem = NAV.find(item => item.id === id);
    if (navItem && currentGroupId) {
      setActivePage(id);
      setMobileOpen(false);
      // Maintain group context during navigation
      router.push(`${navItem.path}/${currentGroupId}`);
    }
  }, [router, currentGroupId]);

  if (authLoading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!firebaseUser) { router.push("/login"); return null; }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {!ratesLoading && <RatesBanner rates={rates} />}
      <Header 
        user={user} 
        groupName={user.group} 
        activeLabel={NAV.find(n => n.id === activePage)?.label || "Dashboard"}
        onOpenMobileSidebar={() => setMobileOpen(true)} 
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
            items={visibleNav} 
            active={activePage} 
            onNav={handleNav} 
            rates={rates} 
            currentGroupId={currentGroupId} 
        />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}