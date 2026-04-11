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
  const confirmPassword = formData.get("confirmPassword") as string;
  const firstName = formData.get("firstName") as string;
  const surname = formData.get("surname") as string;
  const phone = formData.get("phone") as string;
  const groupName = formData.get("groupName") as string;

  // 1. Pre-flight Validations
  if (password !== confirmPassword) return redirect("/login?error=passwords_do_not_match");
  if (phone.length !== 10) return redirect("/login?error=phone_must_be_10_digits");

  const supabase = await createClient();

  try {
    let pool = await sql.connect(sqlConfig);

    // 2. Group Existence Check
    const checkGroup = await pool.request()
      .input('groupName', sql.NVarChar, groupName)
      .query("SELECT group_id FROM dbo.stokvel_groups WHERE group_name = @groupName");

    if (checkGroup.recordset.length > 0) return redirect("/login?error=group_exists");

    // 3. Supabase Auth Registration
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error || !data.user) return redirect("/login?error=auth_failed");

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // STEP A: Create User in SQL & capture the auto-incremented 'user_id'
      const userRes = await transaction.request()
        .input('authId', sql.NVarChar, data.user.id)
        .input('firstName', sql.NVarChar, firstName)
        .input('surname', sql.NVarChar, surname)
        .input('email', sql.NVarChar, email)
        .input('phone', sql.NVarChar, phone)
        .query(`
          INSERT INTO dbo.users (external_auth_id, first_name, surname, email, phone_number, created_at)
          OUTPUT INSERTED.user_id
          VALUES (@authId, @firstName, @surname, @email, @phone, GETDATE())
        `);
      
      const localUserId = userRes.recordset[0].user_id;

      // STEP B: Create Group in SQL
      const groupRes = await transaction.request()
        .input('groupName', sql.NVarChar, groupName)
        .input('amount', sql.Decimal(15, 2), 500.00)
        .input('freq', sql.NVarChar, 'MONTHLY')
        .input('creatorId', sql.Int, localUserId)
        .query(`
          INSERT INTO dbo.stokvel_groups 
            (group_name, contribution_amount, payout_frequency, created_by, created_at)
          OUTPUT INSERTED.group_id
          VALUES 
            (@groupName, @amount, @freq, @creatorId, GETDATE())
        `);
      
      const newGroupId = groupRes.recordset[0].group_id;

      // STEP C: Link Membership (Matches your screenshot: join_date)
      await transaction.request()
        .input('localId', sql.Int, localUserId)
        .input('groupId', sql.Int, newGroupId)
        .input('roleId', sql.Int, 1) // Role 1 = Admin
        .query(`
          INSERT INTO dbo.group_members (user_id, group_id, role_id, join_date)
          VALUES (@localId, @groupId, @roleId, GETDATE())
        `);

      await transaction.commit();
    } catch (innerErr) {
      await transaction.rollback();
      throw innerErr;
    }
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