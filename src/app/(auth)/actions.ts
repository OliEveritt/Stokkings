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
 * SIGN UP: Create Supabase Auth user, create user in SQL, and assign role
 * First user ever becomes ADMIN, subsequent users become MEMBER
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

    const pool = await sql.connect(sqlConfig);

    // Start a transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 3. CHECK: Is this the first user in the system?
      const userCountResult = await transaction.request()
        .query(`
          SELECT COUNT(*) as count FROM dbo.users
        `);
      
      const isFirstUser = userCountResult.recordset[0].count === 0;
      
      // Determine role: First user gets Admin, others get Member
      const roleToAssign = isFirstUser ? "Admin" : "Member";
      
      // 4. Get the role ID for the assigned role
      const roleResult = await transaction.request()
        .input('roleName', sql.NVarChar, roleToAssign)
        .query(`
          SELECT role_id FROM dbo.roles WHERE role_name = @roleName
        `);
      
      const roleId = roleResult.recordset[0]?.role_id;
      
      if (!roleId) {
        throw new Error(`Role '${roleToAssign}' not found in database`);
      }

      // 5. Create User in SQL
      const userRes = await transaction.request()
        .input('authId', sql.NVarChar, data.user.id)
        .input('firstName', sql.NVarChar, firstName)
        .input('surname', sql.NVarChar, surname)
        .input('email', sql.NVarChar, email)
        .input('phone', sql.NVarChar, phone)
        .input('roleId', sql.Int, roleId)
        .query(`
          INSERT INTO dbo.users (external_auth_id, first_name, surname, email, phone_number, role_id, created_at)
          OUTPUT INSERTED.user_id
          VALUES (@authId, @firstName, @surname, @email, @phone, @roleId, GETDATE())
        `);
      
      const localUserId = userRes.recordset[0].user_id;

      // 6. Get the default group ID (if any groups exist)
      const groupRes = await transaction.request()
        .query(`
          SELECT TOP 1 group_id FROM dbo.stokvel_groups
        `);
      
      const defaultGroupId = groupRes.recordset[0]?.group_id;

      if (defaultGroupId) {
        // 7. Add user to group_members with their role
        await transaction.request()
          .input('userId', sql.Int, localUserId)
          .input('groupId', sql.Int, defaultGroupId)
          .input('roleId', sql.Int, roleId)
          .query(`
            INSERT INTO dbo.group_members (user_id, group_id, role_id, join_date)
            VALUES (@userId, @groupId, @roleId, GETDATE())
          `);
      }

      // Commit the transaction
      await transaction.commit();
      
    } catch (innerErr) {
      await transaction.rollback();
      throw innerErr;
    }
      
  } catch (err) {
    console.error("--- DATABASE SYNC ERROR ---");
    console.error((err as Error).message);
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
