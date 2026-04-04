import { Shield } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4">
            <Shield size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Sign in to Stokkings</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back to your stokvel group</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-amber-700 font-medium">Auth integration pending — this is a placeholder page.</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" placeholder="you@example.com" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" placeholder="********" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <button className="w-full bg-emerald-600 text-white font-medium py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm">
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
