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
 * SIGN UP: Create Supabase Auth user and sync to Azure SQL
 */
export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const firstName = formData.get("firstName") as string;
  const surname = formData.get("surname") as string;
  const phone = formData.get("phone") as string;

  const supabase = await createClient();

  // 1. Create Identity in Supabase
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error || !data.user) return redirect("/login?error=auth_failed");

  // 2. Sync to Azure SQL Ledger
  try {
    let pool = await sql.connect(sqlConfig);
    await pool.request()
      .input('authId', sql.NVarChar, data.user.id)
      .input('firstName', sql.NVarChar, firstName)
      .input('surname', sql.NVarChar, surname)
      .input('email', sql.NVarChar, email)
      .input('phone', sql.NVarChar, phone)
      .query(`
        INSERT INTO dbo.users (external_auth_id, first_name, surname, email, phone_number)
        VALUES (@authId, @firstName, @surname, @email, @phone)
      `); // <--- Cleaned: removed the cite tag
  } catch (err) {
    console.error("SQL Sync Error:", err);
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
 * LOGOUT: Clear session and redirect
 */
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/login");
}

export async function getUserMandates() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const pool = await sql.connect(sqlConfig);
  const result = await pool.request()
    .input('userId', sql.NVarChar, user.id)
    .query(`
      SELECT 
        m.group_id, 
        g.group_name, 
        r.role_name 
      FROM dbo.memberships m
      JOIN dbo.groups g ON m.group_id = g.id
      JOIN dbo.roles r ON m.role_id = r.id
      WHERE m.external_auth_id = @userId AND m.status = 'Active'
    `);

  return result.recordset; // Returns [{group_name: 'Group A', role_name: 'Admin'}, ...]
}