"use server";

import { createClient } from "@/utils/supabase/server";
import sql from "mssql";

// Azure SQL Connection Ledger 
const sqlConfig = {
  user: process.env.AZURE_SQL_USER,
  password: process.env.AZURE_SQL_PASSWORD,
  database: process.env.AZURE_SQL_DATABASE,
  server: process.env.AZURE_SQL_SERVER,
  options: { 
    encrypt: true, 
    trustServerCertificate: false 
  }
};

/**
 * MANDATE AUDIT: Get the active group and role for the logged-in user [cite: 17, 55]
 */
export async function getActiveMembership() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  try {
    let pool = await sql.connect(sqlConfig);
    const result = await pool.request()
      .input('authId', sql.NVarChar, user.id) // Matches NVARCHAR(255) in users table [cite: 28, 38]
      .query(`
        SELECT TOP 1 
          g.group_name, 
          r.role_name 
        FROM dbo.group_members gm
        JOIN dbo.users u ON gm.user_id = u.user_id
        JOIN dbo.stokvel_groups g ON gm.group_id = g.group_id
        JOIN dbo.roles r ON gm.role_id = r.role_id
        WHERE u.external_auth_id = @authId
        ORDER BY gm.join_date ASC -- Uses join_date as per documentation [cite: 58]
      `);
      
    // Default to 'Soweto Savings Circle' if no membership is found yet [cite: 143]
    return result.recordset[0] || { group_name: "Soweto Savings Circle", role_name: "Member" };
  } catch (err) {
    console.error("Database Audit Error:", err);
    return { group_name: "Connection Error", role_name: "Member" };
  }
}

/**
 * MEMBER AUDIT: Pull the full register for a specific group [cite: 54, 143]
 */
export async function getDetailedGroupMembers(groupId: number) {
  try {
    const pool = await sql.connect(sqlConfig);
    const result = await pool.request()
      .input('groupId', sql.Int, groupId)
      .query(`
        SELECT 
          u.first_name, 
          u.surname, 
          u.email, 
          r.role_name, 
          gm.join_date
        FROM dbo.group_members gm
        JOIN dbo.users u ON gm.user_id = u.user_id
        JOIN dbo.roles r ON gm.role_id = r.role_id
        WHERE gm.group_id = @groupId
        ORDER BY r.role_id ASC, u.surname ASC -- Admins/Treasurers first, then alphabetical [cite: 11, 23]
      `);
    return result.recordset;
  } catch (err) {
    console.error("Failed to fetch member register:", err);
    return [];
  }
}

/**
 * DASHBOARD ANALYTICS: Fetch summary metrics for the group
 */
export async function getDashboardStats(groupId: number) {
  try {
    const pool = await sql.connect(sqlConfig);
    
    const result = await pool.request()
      .input('groupId', sql.Int, groupId)
      .query(`
        -- 1. Total Confirmed Contributions
        SELECT SUM(amount) as totalAmount FROM dbo.contributions 
        WHERE group_id = @groupId AND status = 'confirmed';

        -- 2. Member Count
        SELECT COUNT(*) as memberCount FROM dbo.group_members 
        WHERE group_id = @groupId;

        -- 3. Next Scheduled Payout
        SELECT TOP 1 payout_date FROM dbo.payouts 
        WHERE group_id = @groupId AND status = 'scheduled' 
        ORDER BY payout_date ASC;

        -- 4. Compliance Calculation
        SELECT 
          CAST(COUNT(CASE WHEN status = 'confirmed' THEN 1 END) AS FLOAT) / 
          NULLIF(COUNT(*), 0) * 100 as complianceRate
        FROM dbo.contributions 
        WHERE group_id = @groupId;
      `);

    return {
      totalContributions: result.recordsets[0][0]?.totalAmount || 0,
      memberCount: result.recordsets[1][0]?.memberCount || 0,
      nextPayout: result.recordsets[2][0]?.payout_date || null,
      complianceRate: Math.round(result.recordsets[3][0]?.complianceRate || 0)
    };
  } catch (err) {
    console.error("Dashboard Stats Audit Failure:", err);
    return { totalContributions: 0, memberCount: 0, nextPayout: null, complianceRate: 0 };
  }
}