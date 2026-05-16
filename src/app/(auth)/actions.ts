"use server";

import { redirect } from "next/navigation";

// Only use this for hard-overrides or clearing cookies
export async function redirectToDashboard() {
  redirect("/dashboard");
}

export async function redirectToLogin() {
  redirect("/login");
}