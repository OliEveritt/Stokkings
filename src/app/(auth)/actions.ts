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
 * SIGN UP: Create Supabase Auth user, Create New Group, and Link as Admin
 */
export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string; // 👈 Added
  const firstName = formData.get("firstName") as string;
  const surname = formData.get("surname") as string;
  const phone = formData.get("phone") as string;
  const groupName = formData.get("groupName") as string;

  // 1. Password Match Validation
  if (password !== confirmPassword) {
    return redirect("/login?error=passwords_do_not_match");
  }

  // 2. Phone Length Validation (Exactly 10)
  if (phone.length !== 10) {
    return redirect("/login?error=phone_must_be_10_digits");
  }

  const supabase = await createClient();

  try {
    let pool = await sql.connect(sqlConfig);

    // 3. Check if Group Name already exists in SQL
    const checkGroup = await pool.request()
      .input('groupName', sql.NVarChar, groupName)
      .query("SELECT id FROM dbo.groups WHERE group_name = @groupName");

    if (checkGroup.recordset.length > 0) {
      return redirect("/login?error=group_exists");
    }

    // 4. Create Identity in Supabase
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error || !data.user) return redirect("/login?error=auth_failed");

    // 5. Atomic Sync to Azure SQL
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // A. Create User
      await transaction.request()
        .input('authId', sql.NVarChar, data.user.id)
        .input('firstName', sql.NVarChar, firstName)
        .input('surname', sql.NVarChar, surname)
        .input('email', sql.NVarChar, email)
        .input('phone', sql.NVarChar, phone)
        .query(`INSERT INTO dbo.users (external_auth_id, first_name, surname, email, phone_number)
                VALUES (@authId, @firstName, @surname, @email, @phone)`);

      // B. Create Group
      const groupRes = await transaction.request()
        .input('groupName', sql.NVarChar, groupName)
        .query(`INSERT INTO dbo.groups (group_name, created_at)
                OUTPUT INSERTED.id
                VALUES (@groupName, GETDATE())`);
      
      const newGroupId = groupRes.recordset[0].id;

      // C. Create Membership (Role 1 = Admin)
      await transaction.request()
        .input('userId', sql.NVarChar, data.user.id)
        .input('groupId', sql.Int, newGroupId)
        .input('roleId', sql.Int, 1) 
        .query(`INSERT INTO dbo.memberships (external_auth_id, group_id, role_id, status)
                VALUES (@userId, @groupId, @roleId, 'Active')`);

      await transaction.commit();
    } catch (innerErr) {
      await transaction.rollback();
      throw innerErr;
    }
  } catch (err) {
    console.error("SQL Transaction Error:", err);
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