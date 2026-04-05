import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

export async function GET(req: NextRequest) {
  const authId = req.headers.get("x-auth-id") || "";
  const res = await fetch(`${BACKEND_URL}/api/groups`, {
    headers: { "x-auth-id": authId },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest) {
  const authId = req.headers.get("x-auth-id") || "";
  const body = await req.json();
  const res = await fetch(`${BACKEND_URL}/api/groups`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-auth-id": authId,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
