/**
 * US-2.3: Payment Success Page
 * After Stripe payment succeeds, user lands here.
 * This page calls the verify API to update the contribution status.
 */

"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const contributionId = searchParams.get("contributionId");
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    async function verifyPayment() {
      if (!contributionId) {
        setTimeout(() => router.push("/contributions"), 3000);
        return;
      }

      try {
        // Call the verify API to update contribution status
        const response = await fetch(`/api/payments/verify?contributionId=${contributionId}`);
        const data = await response.json();

        if (data.success) {
          setVerified(true);
        }
      } catch (err) {
        console.error("Verification error:", err);
      } finally {
        setVerifying(false);
      }
    }
    verifyPayment();
  }, [contributionId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
        {verifying ? (
          <>
            <div className="text-4xl mb-4">🔄</div>
            <h1 className="text-2xl font-bold mb-2">Verifying Payment...</h1>
          </>
        ) : verified ? (
          <>
            <div className="text-4xl mb-4">✅</div>
            <h1 className="text-2xl font-bold mb-2 text-green-600">Payment Successful!</h1>
            <Link href="/contributions" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg">
              View Contributions
            </Link>
          </>
        ) : (
          <>
            <div className="text-4xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold mb-2">Verification Failed</h1>
            <Link href="/contributions" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg">
              Go to Contributions
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
