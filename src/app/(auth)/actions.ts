"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "@/lib/firebase-admin";

/**
 * LOGIN ACTION
 * Verifies the client-side ID token and creates a secure HTTP-only session cookie.
 */
export async function login(idToken: string) {
  try {
    // 1. Verify the token is legitimate
    await adminAuth.verifyIdToken(idToken);

    // 2. Set 5-day session (Firebase max for session cookies)
    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    });

    // 3. Set the cookie using Next.js Headers API
    const cookieStore = await cookies();
    cookieStore.set("session", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: expiresIn / 1000,
      path: "/",
    });

    return { success: true };
  } catch (error: any) {
    console.error("Session Cookie Creation Error:", error.message);
    return { success: false, error: "Identity verification failed." };
  }
}

/**
 * LOGOUT ACTION
 * Clears the session cookie and invalidates the session.
 */
export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  redirect("/login");
}

/**
 * SESSION VERIFICATION (Helper)
 * Used in Middleware or Server Components to check if a user is authenticated.
 */
export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;

  if (!session) return null;

  try {
    return await adminAuth.verifySessionCookie(session, true);
  } catch (error) {
    return null;
  }
}