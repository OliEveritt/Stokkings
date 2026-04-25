]/**
 * US-2.3: Member Payment with Stripe
 * This API creates a Stripe Checkout session and returns a redirect URL.
 * When a member clicks "Pay Now", this endpoint is called.
 */
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

// Lazy load Stripe - only initialize when API is called
let stripe: any = null;

function getStripe() {
  if (!stripe) {
    // Dynamically import Stripe to avoid build-time initialization
    const Stripe = require('stripe');
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return stripe;
}

export async function POST(req: NextRequest) {
  try {
    // STEP 1: Verify the user is logged in (Firebase Auth token)
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    await adminAuth.verifyIdToken(token); // Validates the Firebase token

    // STEP 2: Get the contribution details from the request body
    const body = await req.json();
    const { contributionId, amount } = body;

    // STEP 3: Get Stripe instance (lazy loaded)
    const stripe = getStripe();

    // STEP 4: Create a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'zar',
          product_data: {
            name: `Stokvel Contribution`,
            description: `Contribution ID: ${contributionId}`,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?contributionId=${contributionId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/cancel?contributionId=${contributionId}`,
      metadata: { contributionId },
    });

    // STEP 5: Return the Stripe checkout URL to the frontend
    return NextResponse.json({ checkoutUrl: session.url });
  } catch (error) {
    console.error('Error creating Stripe checkout:', error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
