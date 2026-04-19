"use client";

import { useState } from "react";

export default function TestRolesPage() {
  const [email, setEmail] = useState("");
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/local-user?email=${email}`);
      const data = await res.json();
      setUserData(data);
    } catch (error) {
      console.error(error);
      setUserData({ error: "Failed to fetch" });
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Test Role System</h1>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="admin@stokvel.com or member@stokvel.com"
        />
      </div>
      
      <button
        onClick={fetchUser}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        {loading ? "Loading..." : "Get User Role"}
      </button>

      {userData && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h2 className="font-bold mb-2">Result:</h2>
          <pre className="text-sm">{JSON.stringify(userData, null, 2)}</pre>
          
          {userData.user && (
            <div className="mt-4 p-3 rounded font-bold text-center"
              style={{
                backgroundColor: userData.user.role === "Admin" ? "#dcfce7" : "#fee2e2",
                color: userData.user.role === "Admin" ? "#166534" : "#991b1b"
              }}>
              Role: {userData.user.role}
              {userData.user.role === "Admin" && " ✅ Has Admin Access"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
