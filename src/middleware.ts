import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/middleware';
import sql from "mssql";

const sqlConfig = {
  user: process.env.AZURE_SQL_USER,
  password: process.env.AZURE_SQL_PASSWORD,
  database: process.env.AZURE_SQL_DATABASE,
  server: process.env.AZURE_SQL_SERVER || "",
  options: { encrypt: true, trustServerCertificate: false }
};

const adminOnlyPages = ['/members', '/invitations', '/create-group'];
const treasurerPages = ['/payouts', '/analytics'];

async function getUserRole(authId: string): Promise<string | null> {
  try {
    const pool = await sql.connect(sqlConfig);
    const result = await pool.request()
      .input('authId', sql.NVarChar, authId)
      .query(`
        SELECT r.role_name 
        FROM dbo.users u
        LEFT JOIN dbo.roles r ON u.role_id = r.role_id
        WHERE u.external_auth_id = @authId
      `);
    return result.recordset[0]?.role_name || null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  
  const path = request.nextUrl.pathname;

  if (path.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (path.startsWith('/login') && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (path === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (user && (adminOnlyPages.some(p => path.startsWith(p)) || treasurerPages.some(p => path.startsWith(p)))) {
    const role = await getUserRole(user.id);
    
    if (adminOnlyPages.some(p => path.startsWith(p)) && role !== 'Admin') {
      return NextResponse.redirect(new URL('/dashboard?error=unauthorized', request.url));
    }
    
    if (treasurerPages.some(p => path.startsWith(p)) && role !== 'Admin' && role !== 'Treasurer') {
      return NextResponse.redirect(new URL('/dashboard?error=unauthorized', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
