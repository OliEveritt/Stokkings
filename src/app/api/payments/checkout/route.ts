import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { adminAuth } from "@/lib/firebase-admin";

let stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set in .env");
    stripe = new Stripe(key);
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
    if (!contributionId || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "contributionId and a positive amount are required" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_BASE_URL is not set in .env" },
        { status: 500 }
      );
    }

    const stripeClient = getStripe();
    const session = await stripeClient.checkout.sessions.create({
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
      success_url: `${baseUrl}/payment/success?contributionId=${contributionId}`,
      cancel_url: `${baseUrl}/payment/cancel?contributionId=${contributionId}`,
      metadata: { contributionId },
    });

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (error) {
    const err = error as { message?: string; type?: string; code?: string };
    console.error("Error creating Stripe checkout:", err);
    return NextResponse.json(
      {
        error: err.message ?? "Failed to create checkout session",
        type: err.type,
        code: err.code,
      },
      { status: 500 }
    );
  }
}
