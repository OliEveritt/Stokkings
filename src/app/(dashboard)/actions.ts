"use server";

import { createClient } from "@/utils/supabase/server";
import sql from "mssql";

const sqlConfig = {
  user: process.env.AZURE_SQL_USER,
  password: process.env.AZURE_SQL_PASSWORD,
  database: process.env.AZURE_SQL_DATABASE,
  server: process.env.AZURE_SQL_SERVER || "",
  options: { encrypt: true, trustServerCertificate: false }
};

export async function getActiveMembership(requestedGroupId?: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  try {
    let pool = await sql.connect(sqlConfig);
    const request = pool.request().input('authId', sql.NVarChar, user.id);
    let query = `
      SELECT TOP 1 u.first_name, u.surname, u.email, g.group_name, g.group_id, r.role_name
      FROM dbo.group_members gm
      JOIN dbo.users u ON gm.user_id = u.user_id
      JOIN dbo.stokvel_groups g ON gm.group_id = g.group_id
      JOIN dbo.roles r ON gm.role_id = r.role_id
      WHERE u.external_auth_id = @authId
    `;
    if (requestedGroupId) {
      request.input('gId', sql.Int, requestedGroupId);
      query += ` AND g.group_id = @gId`;
    }
    query += ` ORDER BY gm.join_date ASC`;
    const result = await request.query(query);
    return result.recordset[0] || null;
  } catch (err) { return null; }
}

export async function getAllUserMandates() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  try {
    let pool = await sql.connect(sqlConfig);
    const result = await pool.request()
      .input('authId', sql.NVarChar, user.id)
      .query(`
        SELECT g.group_id, g.group_name, r.role_name 
        FROM dbo.group_members gm
        JOIN dbo.stokvel_groups g ON gm.group_id = g.group_id
        JOIN dbo.roles r ON gm.role_id = r.role_id
        JOIN dbo.users u ON gm.user_id = u.user_id
        WHERE u.external_auth_id = @authId
      `);
    return result.recordset;
  } catch (err) { return []; }
}

export async function getDashboardStats(groupId: string | number) {
  try {
    const pool = await sql.connect(sqlConfig);
    const result = await pool.request()
      .input('groupId', sql.Int, Number(groupId)) 
      .query(`
        SELECT ISNULL(SUM(amount), 0) as totalAmount FROM dbo.contributions WHERE group_id = @groupId AND status = 'confirmed';
        SELECT COUNT(DISTINCT user_id) as memberCount FROM dbo.group_members WHERE group_id = @groupId;
        SELECT TOP 1 payout_date FROM dbo.payouts WHERE group_id = @groupId AND status = 'scheduled' AND payout_date >= GETDATE() ORDER BY payout_date ASC;
        SELECT CAST(COUNT(CASE WHEN status = 'confirmed' THEN 1 END) AS FLOAT) / NULLIF(COUNT(*), 0) * 100 as complianceRate FROM dbo.contributions WHERE group_id = @groupId;
      `);
    return {
      totalContributions: (result.recordsets as any[][])[0][0]?.totalAmount || 0,
      memberCount: (result.recordsets as any[][])[1][0]?.memberCount || 0,
      nextPayout: (result.recordsets as any[][])[2][0]?.payout_date || null,
      complianceRate: Math.round((result.recordsets as any[][])[3][0]?.complianceRate || 0)
    };
  } catch (err) { return { totalContributions: 0, memberCount: 0, nextPayout: null, complianceRate: 0 }; }
}