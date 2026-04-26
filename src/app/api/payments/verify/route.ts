/**
 * US-2.3: Payment Verification
 * After Stripe redirects back to our app, this API updates the contribution status.
 * Called from the /payment/success page.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";

export async function GET(req: NextRequest) {
  try {
    // STEP 1: Get the contribution ID from the URL query parameter
    const searchParams = req.nextUrl.searchParams;
    const contributionId = searchParams.get('contributionId');

    if (!contributionId) {
      return NextResponse.json({ error: "Missing contributionId" }, { status: 400 });
    }

    // STEP 2: Find the contribution in Firestore
    const contributionRef = doc(db, 'contributions', contributionId);
    const contributionSnap = await getDoc(contributionRef);
    
    if (!contributionSnap.exists()) {
      return NextResponse.json({ error: "Contribution not found" }, { status: 404 });
    }

    // STEP 3: Update the contribution status to "confirmed"
    await updateDoc(contributionRef, {
      status: 'confirmed',                              // Changes from "pending" to "confirmed"
      paymentIntentId: 'stripe_' + Date.now(),          // Record the payment ID
      updatedAt: new Date().toISOString(),              // Timestamp of confirmation
    });

    // STEP 4: Return success response
    return NextResponse.json({ success: true, status: 'confirmed' });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
