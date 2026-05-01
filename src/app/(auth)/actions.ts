"use server";

import { redirect } from "next/navigation";

// This file is kept for compatibility but logout is handled client-side
// to avoid redirect loops

export async function logout() {
  // Server-side logout - redirect to login page
  // The actual Firebase signOut happens client-side
  redirect("/login");
}

export async function login(_formData: FormData) {
  redirect("/login");
}

export async function signUp(_formData: FormData) {
  redirect("/sign-up");
}
