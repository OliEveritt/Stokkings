"use client";

import { useFirebaseAuth } from "@/context/FirebaseAuthContext";

export default function DebugPage() {
  const { user, loading } = useFirebaseAuth();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Page</h1>
      <p>Loading: {loading ? "true" : "false"}</p>
      <p>User: {user ? user.email : "null"}</p>
      <p>Role: {userRole || "none"}</p>
      <pre className="mt-4 p-4 bg-gray-100 rounded">
        {JSON.stringify(user, null, 2)}
      </pre>
    </div>
  );
}
