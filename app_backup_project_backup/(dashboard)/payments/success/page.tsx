import { Shield } from "lucide-react";

export default function PaymentSuccessPage() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
        <Shield size={32} className="text-emerald-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
      <p className="text-sm text-gray-500 text-center max-w-sm">
        Your contribution has been recorded. You&apos;ll receive a confirmation shortly.
      </p>
    </div>
  );
}
