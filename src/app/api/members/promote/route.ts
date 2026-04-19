import { NextRequest, NextResponse } from "next/server";
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
    const { user_id, group_id } = await req.json();

    const pool = await sql.connect(sqlConfig);
    
    // Get Admin role ID
    const roleResult = await pool.request()
      .query("SELECT role_id FROM dbo.roles WHERE role_name = 'Admin'");
    
    const adminRoleId = roleResult.recordset[0]?.role_id;
    
    if (!adminRoleId) {
      return NextResponse.json({ error: "Admin role not found" }, { status: 500 });
    }

    // Update user's role to Admin
    await pool.request()
      .input('userId', sql.Int, user_id)
      .input('groupId', sql.Int, group_id)
      .input('roleId', sql.Int, adminRoleId)
      .query(`
        UPDATE dbo.group_members 
        SET role_id = @roleId 
        WHERE user_id = @userId AND group_id = @groupId
      `);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error promoting member:", error);
    return NextResponse.json({ error: "Failed to promote member" }, { status: 500 });
  }
}
