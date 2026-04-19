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

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const pool = await sql.connect(sqlConfig);
    const result = await pool.request()
      .input('authId', sql.NVarChar, user.id)
      .query(`
        SELECT r.role_name 
        FROM dbo.users u
        LEFT JOIN dbo.roles r ON u.role_id = r.role_id
        WHERE u.external_auth_id = @authId
      `);
    
    const role = result.recordset[0]?.role_name || "Member";
    
    return NextResponse.json({ role, userId: user.id });
  } catch (error) {
    console.error("Role check error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
