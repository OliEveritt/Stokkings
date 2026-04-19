import { NextRequest, NextResponse } from "next/server";
import sql from "mssql";

const sqlConfig = {
  user: process.env.AZURE_SQL_USER,
  password: process.env.AZURE_SQL_PASSWORD,
  database: process.env.AZURE_SQL_DATABASE,
  server: process.env.AZURE_SQL_SERVER || "",
  options: { encrypt: true, trustServerCertificate: false }
};

export async function GET(req: NextRequest) {
  try {
    const authId = req.nextUrl.searchParams.get("authId");
    
    if (!authId) {
      return NextResponse.json({ error: "authId required" }, { status: 400 });
    }

    const pool = await sql.connect(sqlConfig);
    
    const result = await pool.request()
      .input('authId', sql.NVarChar, authId)
      .query(`
        SELECT 
          u.user_id,
          u.first_name,
          u.surname,
          u.email,
          u.phone_number,
          r.role_name,
          sg.group_id,
          sg.group_name
        FROM dbo.users u
        LEFT JOIN dbo.roles r ON u.role_id = r.role_id
        LEFT JOIN dbo.group_members gm ON u.user_id = gm.user_id
        LEFT JOIN dbo.stokvel_groups sg ON gm.group_id = sg.group_id
        WHERE u.external_auth_id = @authId
      `);
    
    const user = result.recordset[0];
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching user role:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
