import { NextResponse } from "next/server";
import sql from "mssql";

const sqlConfig = {
  user: process.env.AZURE_SQL_USER,
  password: process.env.AZURE_SQL_PASSWORD,
  database: process.env.AZURE_SQL_DATABASE,
  server: process.env.AZURE_SQL_SERVER || "",
  options: { encrypt: true, trustServerCertificate: false }
};

export async function GET() {
  try {
    const pool = await sql.connect(sqlConfig);
    const result = await pool.request().query(`
      SELECT 
        u.user_id,
        u.first_name,
        u.surname,
        u.email,
        r.role_name,
        gm.group_id
      FROM dbo.users u
      JOIN dbo.group_members gm ON u.user_id = gm.user_id
      JOIN dbo.roles r ON gm.role_id = r.role_id
    `);
    
    return NextResponse.json({ members: result.recordset });
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}
