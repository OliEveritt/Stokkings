import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import sql from "mssql";

const sqlConfig = {
  user: process.env.AZURE_SQL_USER,
  password: process.env.AZURE_SQL_PASSWORD,
  database: process.env.AZURE_SQL_DATABASE,
  server: process.env.AZURE_SQL_SERVER || "",
  options: { encrypt: true, trustServerCertificate: false }
};

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { group_name, contribution_amount, payout_frequency, payout_order } = body;

    // Input validation (UAT 3)
    if (!group_name || group_name.trim().length === 0) {
      return NextResponse.json({ error: "Group name is required" }, { status: 400 });
    }

    if (!contribution_amount || contribution_amount <= 0) {
      return NextResponse.json({ error: "Valid contribution amount is required" }, { status: 400 });
    }

    if (!payout_frequency) {
      return NextResponse.json({ error: "Payout frequency is required" }, { status: 400 });
    }

    const pool = await sql.connect(sqlConfig);

    // Get user's local ID and role (UAT 2: Admin check)
    const userResult = await pool.request()
      .input('authId', sql.NVarChar, user.id)
      .query(`
        SELECT u.user_id, r.role_name
        FROM dbo.users u
        LEFT JOIN dbo.roles r ON u.role_id = r.role_id
        WHERE u.external_auth_id = @authId
      `);
    
    const localUser = userResult.recordset[0];
    
    if (!localUser || localUser.role_name !== 'Admin') {
      return NextResponse.json({ error: "Only Admins can create groups" }, { status: 403 });
    }

    // Create the group
    const result = await pool.request()
      .input('groupName', sql.NVarChar, group_name.trim())
      .input('amount', sql.Decimal(15,2), contribution_amount)
      .input('frequency', sql.NVarChar, payout_frequency)
      .input('createdBy', sql.Int, localUser.user_id)
      .query(`
        INSERT INTO dbo.stokvel_groups (group_name, contribution_amount, payout_frequency, created_by, created_at)
        OUTPUT INSERTED.group_id, INSERTED.group_name
        VALUES (@groupName, @amount, @frequency, @createdBy, GETDATE())
      `);

    const newGroup = result.recordset[0];

    // Automatically add the creator as a member of the group with Admin role
    const roleResult = await pool.request()
      .query(`
        SELECT role_id FROM dbo.roles WHERE role_name = 'Admin'
      `);
    
    const adminRoleId = roleResult.recordset[0]?.role_id;

    if (adminRoleId) {
      await pool.request()
        .input('userId', sql.Int, localUser.user_id)
        .input('groupId', sql.Int, newGroup.group_id)
        .input('roleId', sql.Int, adminRoleId)
        .query(`
          INSERT INTO dbo.group_members (user_id, group_id, role_id, join_date)
          VALUES (@userId, @groupId, @roleId, GETDATE())
        `);
    }

    return NextResponse.json({ 
      success: true, 
      group: newGroup,
      message: "Group created successfully"
    });
  } catch (error) {
    console.error("Error creating group:", error);
    return NextResponse.json({ error: "Failed to create group" }, { status: 500 });
  }
}
