import { NextRequest, NextResponse } from "next/server";

// POST /api/auth/session - Set session cookie after Firebase login
export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();
    if (!idToken) {
      return NextResponse.json({ error: "No token provided" }, { status: 400 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set("session", idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
    return response;
  } catch (error) {
    return NextResponse.json({ error: "Failed to set session" }, { status: 500 });
  }
}

// DELETE /api/auth/session - Clear session cookie on logout
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
