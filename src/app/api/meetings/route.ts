import { NextResponse } from "next/server";

// Meeting creation and listing is handled client-side via Firebase SDK.
// This route is reserved for future server-side operations.
export async function GET() {
  return NextResponse.json({ message: "Use client-side Firebase SDK to fetch meetings" }, { status: 200 });
}
