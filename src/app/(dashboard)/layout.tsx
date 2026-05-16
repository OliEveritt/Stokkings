"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { Home, Users, Calendar, BarChart3, CreditCard, CircleDollarSign, TrendingUp, ClipboardList, UserPlus, Plus, LineChart, Loader2 } from "lucide-react";
import { PieChart } from "lucide-react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import RatesBanner from "@/components/layout/RatesBanner";
import { useRates } from "@/hooks/useRates";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import type { User, NavItem, Role } from "@/types";

// ... NAV array stays the same ...

const NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: Home, roles: ["Member", "Treasurer", "Admin"], path: "/dashboard" },
  { id: "payouts", label: "Payout Schedule", icon: CircleDollarSign, roles: ["Treasurer", "Admin"], path: "/payouts" },
  { id: "meetings", label: "Meetings", icon: Calendar, roles: ["Member", "Treasurer", "Admin"], path: "/meetings" },
  { id: "analytics", label: "Analytics", icon: BarChart3, roles: ["Treasurer", "Admin"], path: "/analytics" },
  { id: "manage-contributions", label: "Manage Contributions", icon: ClipboardList, roles: ["Treasurer", "Admin"], path: "/manage-contributions" },
  { id: "members", label: "Members", icon: Users, roles: ["Admin"], path: "/members" },
  { id: "contributions", label: "My Contributions", icon: CreditCard, roles: ["Member", "Treasurer", "Admin"], path: "/contributions" },
  { id: "savings-projection", label: "Savings Projection", icon: TrendingUp, roles: ["Member", "Treasurer", "Admin"], path: "/savings-projection" },
  { id: "join-group", label: "Join Group", icon: UserPlus, roles: ["Member", "Treasurer", "Admin"], path: "/join-group" },
  { id: "create-group", label: "Create Group", icon: Plus, roles: ["Admin"], path: "/create-group" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user: firebaseUser, loading: authLoading } = useFirebaseAuth();
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const { rates, loading: ratesLoading } = useRates();

  const currentGroupId = (params.groupId || params.id) as string;
  const [mobileOpen, setMobileOpen] = useState(false);

  // REDIRECT LOGIC: Prevent the loop
  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      router.replace("/login"); // Use replace to clear history
    }
  }, [firebaseUser, authLoading, router]);

  const activePage = useMemo(() => {
    const sorted = [...NAV].sort((a, b) => b.path.length - a.path.length);
    const match = sorted.find((n) => pathname.startsWith(n.path));
    return match?.id ?? "dashboard";
  }, [pathname]);

  const user: User = useMemo(() => ({
    name: firebaseUser?.name || "User",
    email: firebaseUser?.email || "",
    avatar: null,
    group: "Stokvel Group",
    role: (firebaseUser?.role as Role) || "Member",
  }), [firebaseUser]);

  const visibleNav = useMemo(
    () => NAV.filter((n) => n.roles.includes(user.role)),
    [user.role]
  );

  const handleNav = useCallback((id: string) => {
    const navItem = NAV.find(item => item.id === id);
    if (!navItem) return;
    setMobileOpen(false);
    router.push(navItem.path);
  }, [router]);

  // Loading State: Banking Apps use clean, centered loaders
  if (authLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="mt-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
          Authenticating Session
        </p>
      </div>
    );
  }

  // If no user, we return null because the useEffect will handle the redirect
  if (!firebaseUser) return null;

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
        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          {/* Add a fade-in animation for children */}
          <div className="animate-in fade-in duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}