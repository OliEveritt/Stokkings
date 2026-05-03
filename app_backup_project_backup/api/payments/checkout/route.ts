import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

let stripe: any = null;

function getStripe() {
  if (!stripe) {
    const Stripe = require("stripe");
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    await adminAuth.verifyIdToken(token);

    const body = await req.json();
    const { contributionId, amount } = body;

    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "zar",
          product_data: {
            name: "Stokvel Contribution",
            description: `Contribution ID: ${contributionId}`,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?contributionId=${contributionId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/cancel?contributionId=${contributionId}`,
      metadata: { contributionId },
    });

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (error) {
    console.error("Error creating Stripe checkout:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
