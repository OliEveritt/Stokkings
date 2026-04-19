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
    
    const userResult = await pool.request()
      .input('authId', sql.NVarChar, user.id)
      .query(`
        SELECT user_id FROM dbo.users WHERE external_auth_id = @authId
      `);
    
    const userId = userResult.recordset[0]?.user_id;
    
    if (!userId) {
      return NextResponse.json({ contributions: [] });
    }

    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT 
          c.contribution_id,
          c.amount,
          c.contribution_date,
          c.status,
          sg.group_name,
          c.user_id
        FROM dbo.contributions c
        JOIN dbo.stokvel_groups sg ON c.group_id = sg.group_id
        WHERE c.user_id = @userId
        ORDER BY c.contribution_date DESC
      `);
    
    return NextResponse.json({ 
      contributions: result.recordset,
      hasContributions: result.recordset.length > 0
    });
  } catch (error) {
    console.error("Error fetching contributions:", error);
    return NextResponse.json({ error: "Failed to fetch contributions" }, { status: 500 });
  }
}
