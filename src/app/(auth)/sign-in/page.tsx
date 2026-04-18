import { SignIn } from "@clerk/nextjs";
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
        
                {/* Clerk Sign-In Component */}
                <SignIn
                    appearance={{
                        elements: {
                            rootBox: "w-full",
                            card: "shadow-none bg-transparent p-0",
                            headerTitle: "hidden",
                            headerSubtitle: "hidden",
                            socialButtonsBlockButton: 
                                "w-full border border-gray-300 rounded-lg py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors mb-2",
                            socialButtonsBlockButtonArrow: "hidden",
                            socialButtonsBlockButtonText: "text-sm font-medium",
                            formButtonPrimary: 
                                "w-full bg-emerald-600 text-white font-medium py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm",
                            formFieldInput: 
                                "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500",
                            formFieldLabel: "block text-sm font-medium text-gray-700 mb-1",
                            footerActionLink: "text-emerald-600 hover:text-emerald-700 text-sm font-medium",
                            identityPreviewText: "text-gray-900 font-medium",
                            identityPreviewEditButton: "text-emerald-600 hover:text-emerald-700 text-sm",
                            dividerLine: "bg-gray-200",
                            dividerText: "text-xs text-gray-400 px-2",
                            form: "space-y-4",
                            formField: "space-y-1",
                            formFieldAction: "text-right text-xs text-gray-500 hover:text-gray-700",
                            alert: "bg-red-50 border border-red-200 rounded-lg p-3 mb-4",
                            alertText: "text-red-700 text-sm",
                        },
                    }}
                    routing="path"
                    path="/sign-in"
                    fallbackRedirectUrl="/dashboard"
                />
            </div>
        </div>
    );
} 