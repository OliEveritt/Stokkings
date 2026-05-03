"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
<<<<<<< Updated upstream
=======
import { useRouter, useParams } from "next/navigation";
>>>>>>> Stashed changes
import {
  Home, Users, Calendar, BarChart3,
  CreditCard, UserPlus, CircleDollarSign, ClipboardList,
} from "lucide-react";
import { useRouter } from "next/navigation";

import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import RatesBanner from "@/components/layout/RatesBanner";
import { useRates } from "@/hooks/useRates";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { User, NavItem, Role } from "@/types";

const MOCK_NOTIFS: Notification[] = [
  { id: 1, text: "Contribution confirmed — R500", time: "2h ago", read: false },
];

const NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: Home, roles: ["Member", "Treasurer", "Admin"], path: "/dashboard" },
  { id: "payments", label: "Payments", icon: CreditCard, roles: ["Member", "Treasurer", "Admin"], path: "/payments" },
  { id: "payouts", label: "Payout Schedule", icon: CircleDollarSign, roles: ["Treasurer", "Admin"], path: "/payouts" },
  { id: "meetings", label: "Meetings", icon: Calendar, roles: ["Member", "Treasurer", "Admin"], path: "/meetings" },
  { id: "analytics", label: "Analytics", icon: BarChart3, roles: ["Treasurer", "Admin"], path: "/analytics" },
  { id: "manage-contributions", label: "Manage Contributions", icon: ClipboardList, roles: ["Treasurer", "Admin"], path: "/manage-contributions" },
  { id: "members", label: "Members", icon: Users, roles: ["Admin"], path: "/members" },
  { id: "contributions", label: "My Contributions", icon: CreditCard, roles: ["Member", "Treasurer", "Admin"], path: "/contributions" },
  { id: "create-group", label: "Create Group", icon: Users, roles: ["Admin"], path: "/create-group" },
  { id: "invitations", label: "Invitations", icon: UserPlus, roles: ["Admin"], path: "/invitations" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user: firebaseUser, loading: authLoading } = useFirebaseAuth();
  const router = useRouter();
<<<<<<< Updated upstream
=======
  const params = useParams();
  
  const currentGroupId = (params.groupId || params.id) as string;

>>>>>>> Stashed changes
  const { rates, loading: ratesLoading } = useRates();
  const [activePage, setActivePage] = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userRole, setUserRole] = useState<Role>("Member");
  const [userName, setUserName] = useState<string>("User");

  useEffect(() => {
    if (!firebaseUser) return;
    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserRole(data.role || "Member");
          setUserName(data.fullName || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "User");
        } else {
          setUserName(firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "User");
        }
      } catch (err) {
        console.error("Failed to fetch user role", err);
      }
    };
    fetchUserData();
  }, [firebaseUser]);

<<<<<<< Updated upstream
  // All hooks must be called before any conditional returns
  const user: User & { group_id?: number } = {
    name: firebaseUser?.name || "Loading...",
    email: firebaseUser?.email || "",
    avatar: null,
    group: "Stokvel Group",
    role: firebaseUser?.role || "Member",
=======
  const user: User = {
    name: userName,
    email: firebaseUser?.email || "",
    avatar: null,
    group: "Stokvel Group",
    role: userRole,
>>>>>>> Stashed changes
  };

  const roleOverride = user.role as Role;

  const visibleNav = useMemo(
    () => NAV.filter((n) => n.roles.includes(roleOverride)),
    [roleOverride]
  );

  const activeLabel = NAV.find((n) => n.id === activePage)?.label || "Dashboard";

  const handleNav = useCallback((id: string) => {
    const navItem = NAV.find(item => item.id === id);
    if (navItem) {
      setActivePage(id);
      setMobileOpen(false);
<<<<<<< Updated upstream
      router.push(navItem.path);
=======
      router.push(`${navItem.path}/${currentGroupId}`);
>>>>>>> Stashed changes
    }
  }, [router]);

  const handleRoleChange = useCallback((role: Role) => {
    console.log("Role change requested:", role);
  }, []);

  const handleMandateSwitch = useCallback(async (newGroupId: number) => {
    console.log("Switch to group:", newGroupId);
  }, []);

  // Now conditional returns (after all hooks)
  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!firebaseUser) {
    router.push("/login");
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden font-sans">
      {!ratesLoading && <RatesBanner rates={rates} />}
<<<<<<< Updated upstream

      <Header
        user={user}
        groupName={user.group}
        activeLabel={activeLabel}
        notifications={MOCK_NOTIFS}
        roleOverride={roleOverride}
        mandates={[]}
        onMandateSwitch={handleMandateSwitch}
        onRoleChange={handleRoleChange}
        onOpenMobileSidebar={() => setMobileOpen(true)}
=======
      <Header 
        user={user} 
        groupName={user.group} 
        activeLabel={NAV.find(n => n.id === activePage)?.label || "Dashboard"}
        onOpenMobileSidebar={() => setMobileOpen(true)}
        notifications={[]}
        roleOverride={null}
        mandates={[]}
        onMandateSwitch={() => {}}
        onRoleChange={() => {}}
>>>>>>> Stashed changes
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
  );
}
