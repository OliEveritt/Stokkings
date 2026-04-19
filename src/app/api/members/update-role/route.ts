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
    const { user_id, group_id, role_name } = await req.json();

    const pool = await sql.connect(sqlConfig);
    
    // Get the role ID for the requested role
    const roleResult = await pool.request()
      .input('roleName', sql.NVarChar, role_name)
      .query("SELECT role_id FROM dbo.roles WHERE role_name = @roleName");
    
    const roleId = roleResult.recordset[0]?.role_id;
    
    if (!roleId) {
      return NextResponse.json({ error: `Role '${role_name}' not found` }, { status: 500 });
    }

    // Update user's role
    await pool.request()
      .input('userId', sql.Int, user_id)
      .input('groupId', sql.Int, group_id)
      .input('roleId', sql.Int, roleId)
      .query(`
        UPDATE dbo.group_members 
        SET role_id = @roleId 
        WHERE user_id = @userId AND group_id = @groupId
      `);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating role:", error);
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
}
