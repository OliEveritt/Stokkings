"use client";

import { useEffect } from "react";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const { logout, user } = useFirebaseAuth();
  const router = useRouter();

  useEffect(() => {
    console.log("LogoutPage: Starting logout process");
    const doLogout = async () => {
      try {
        await logout();
        console.log("LogoutPage: Firebase logout successful");
        localStorage.clear();
        sessionStorage.clear();
        console.log("LogoutPage: Storage cleared");
        console.log("LogoutPage: Redirecting to login");
        window.location.href = "/login";
      } catch (error) {
        console.error("LogoutPage: Logout error", error);
        window.location.href = "/login";
      }
    };
    doLogout();
  }, [logout]);

  return <div className="flex items-center justify-center min-h-screen">Logging out...</div>;
}
