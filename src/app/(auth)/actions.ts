"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import sql from "mssql";

// Azure SQL Connection Configuration
const sqlConfig = {
  user: process.env.AZURE_SQL_USER,
  password: process.env.AZURE_SQL_PASSWORD,
  database: process.env.AZURE_SQL_DATABASE,
  server: process.env.AZURE_SQL_SERVER || "",
  options: { 
    encrypt: true, 
    trustServerCertificate: false 
  }
};

/**
 * SIGN UP: Create Supabase Auth user and create user in SQL (no group creation)
 */
export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const firstName = formData.get("firstName") as string;
  const surname = formData.get("surname") as string;
  const phone = formData.get("phone") as string;

  // 1. Pre-flight Validations
  if (password !== confirmPassword) return redirect("/login?error=passwords_do_not_match");
  if (phone.length !== 10) return redirect("/login?error=phone_must_be_10_digits");

  const supabase = await createClient();

  try {
    // 2. Supabase Auth Registration
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error || !data.user) return redirect("/login?error=auth_failed");

    let pool = await sql.connect(sqlConfig);

    // 3. Create User in SQL
    await pool.request()
      .input('authId', sql.NVarChar, data.user.id)
      .input('firstName', sql.NVarChar, firstName)
      .input('surname', sql.NVarChar, surname)
      .input('email', sql.NVarChar, email)
      .input('phone', sql.NVarChar, phone)
      .query(`
        INSERT INTO dbo.users (external_auth_id, first_name, surname, email, phone_number, created_at)
        VALUES (@authId, @firstName, @surname, @email, @phone, GETDATE())
      `);
      
  } catch (err: any) {
    console.error("--- DATABASE SYNC ERROR ---");
    console.error(err.message); 
    console.error("---------------------------");
    return redirect("/login?error=sync_failed");
  }

  return redirect("/dashboard");
}

/**
 * LOGIN: Authenticate user via Supabase
 */
export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return redirect("/login?error=invalid_credentials");

  return redirect("/dashboard");
}

/**
 * LOGOUT: Clear session
 */
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/login");
}
