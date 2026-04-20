import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    await adminAuth.verifyIdToken(token);

    const body = await req.json();
    const { contributionId, amount } = body;

    // Mock checkout URL
    const mockCheckoutUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/payment/mock-checkout?contributionId=${contributionId}&amount=${amount}`;

    return NextResponse.json({ checkoutUrl: mockCheckoutUrl });
  } catch (error) {
    console.error('Error creating checkout:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
