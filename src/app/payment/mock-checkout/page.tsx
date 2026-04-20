"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function MockCheckoutPage() {
  const searchParams = useSearchParams();
  const contributionId = searchParams.get("contributionId");
  const amount = searchParams.get("amount");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4 text-center">Mock Yoco Checkout</h1>
        <div className="bg-gray-100 p-4 rounded-lg mb-6">
          <p className="text-lg">Amount: <strong>R{amount}</strong></p>
          <p className="text-sm text-gray-600">Contribution ID: {contributionId}</p>
        </div>

        <div className="space-y-3">
          <Link
            href={`/payment/success?contributionId=${contributionId}`}
            className="block w-full text-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            ✅ Simulate Successful Payment
          </Link>

          <Link
            href={`/payment/cancel?contributionId=${contributionId}`}
            className="block w-full text-center px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            ❌ Simulate Cancelled Payment
          </Link>

          <Link
            href={`/payment/failure?contributionId=${contributionId}`}
            className="block w-full text-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            💔 Simulate Failed Payment
          </Link>
        </div>

        <Link
          href="/contributions"
          className="block w-full text-center mt-4 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
        >
          Back to Contributions
        </Link>
      </div>
    </div>
  );
}
