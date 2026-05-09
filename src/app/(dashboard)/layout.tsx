"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import {
  Home, Users, Calendar, BarChart3, CreditCard, 
  UserPlus, CircleDollarSign, TrendingUp, ClipboardList,
} from "lucide-react";

import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import RatesBanner from "@/components/layout/RatesBanner";
import { useRates } from "@/hooks/useRates";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { User, NavItem, Role } from "@/types";

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
  const pathname = usePathname();
  
  const rawId = params.groupId || params.id;
  const currentGroupId = rawId === "undefined" ? null : (rawId as string);

  const { rates, loading: ratesLoading } = useRates();
  const [activePage, setActivePage] = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userRole, setUserRole] = useState<Role>("Member");
  const [userName, setUserName] = useState<string>("User");

  /**
   * FIX: Secure Redirection Side-Effect
   * Moves the router push out of the render body to prevent React state conflicts.
   */
  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      router.push("/login");
    }
  }, [firebaseUser, authLoading, router]);

  useEffect(() => {
    const currentItem = NAV.find(item => pathname.startsWith(item.path));
    if (currentItem) setActivePage(currentItem.id);
  }, [pathname]);

  useEffect(() => {
    if (!firebaseUser) return;
    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserRole(data.role || "Member");
          setUserName(data.name || data.fullName || "User");
        }
      } catch (err) {
        console.error("Audit Fail - RBAC Sync Error:", err);
      }
    };
    fetchUserData();
  }, [firebaseUser]);

  const userContext = useMemo((): User => ({
  name: userName !== "User" ? userName : (firebaseUser?.name || "User"),
    email: firebaseUser?.email || "",
    avatar: null,
    group: "Stokvel Group",
    role: userRole,
  }), [userName, firebaseUser?.email, userRole]);

  const visibleNav = useMemo(
    () => NAV.filter((n) => n.roles.includes(userRole)),
    [userRole]
  );

  const handleNav = useCallback((id: string) => {
    const navItem = NAV.find(item => item.id === id);
    if (navItem) {
      setActivePage(id);
      setMobileOpen(false);
      const isGlobalRoute = ["invitations", "savings-projection"].includes(id);
      
      if (isGlobalRoute || !currentGroupId) {
        router.push(navItem.path);
      } else {
        router.push(`${navItem.path}/${currentGroupId}`);
      }
    }
  }, [router, currentGroupId]);

  // Loading State with Banking Branding
  if (authLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent mb-4" />
        <p className="text-emerald-900 font-black text-[10px] uppercase tracking-[0.2em]">Verifying Identity Context...</p>
      </div>
    );
  }

  // Prevent rendering if not authenticated
  if (!firebaseUser) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden font-sans">
      <div className="min-h-[40px] w-full bg-emerald-950">
        {!ratesLoading && rates ? (
          <RatesBanner rates={rates} />
        ) : (
          <div className="h-10 w-full flex items-center justify-center">
            <div className="h-1 w-1/3 bg-emerald-900 animate-pulse rounded-full" />
          </div>
        )}
      </div>

      <Header 
        user={userContext} 
        groupName={userContext.group} 
        activeLabel={NAV.find(n => n.id === activePage)?.label || "Dashboard"}
        onOpenMobileSidebar={() => setMobileOpen(true)}
        notifications={[]} 
        roleOverride={userRole} 
        mandates={[]}
        onMandateSwitch={() => {}}
        onRoleChange={() => {}}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          items={visibleNav} 
          active={activePage} 
          onNav={handleNav} 
          rates={rates} 
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-white shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-right-4 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}


