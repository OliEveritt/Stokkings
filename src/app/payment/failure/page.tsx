/**
 * US-2.3: Payment Failure Page
 * If Stripe payment fails (e.g., card declined), user lands here.
 * Contribution remains "pending".
 */

"use client";

import Link from "next/link";

export default function PaymentFailurePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
        <div className="text-4xl mb-4">💔</div>
        <h1 className="text-2xl font-bold mb-2 text-red-600">Payment Failed</h1>
        <p className="text-gray-600 mb-6">Something went wrong. Please try again later.</p>
        <Link href="/contributions" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg">
          Return to Contributions
        </Link>
      </div>
    </div>
  );
}
