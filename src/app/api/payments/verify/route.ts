import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const contributionId = searchParams.get('contributionId');

    if (!contributionId) {
      return NextResponse.json({ error: "Missing contributionId" }, { status: 400 });
    }

    const contributionRef = doc(db, 'contributions', contributionId);
    const contributionSnap = await getDoc(contributionRef);
    
    if (!contributionSnap.exists()) {
      return NextResponse.json({ error: "Contribution not found" }, { status: 404 });
    }

    await updateDoc(contributionRef, {
      status: 'confirmed',
      paymentIntentId: 'stripe_' + Date.now(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, status: 'confirmed' });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
