"use client";

import { useEffect } from "react";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const { logout } = useFirebaseAuth();
  const router = useRouter();

  useEffect(() => {
    const doLogout = async () => {
      try {
        await logout();
        // Instead of full reload, use client‑side navigation
        router.push("/login");
      } catch (error) {
        console.error("Logout error:", error);
        // Even on error, redirect to login
        router.push("/login");
      }
    };
    doLogout();
  }, [logout, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="text-lg">Logging out...</div>
      </div>
    </div>
  );
}