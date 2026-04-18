"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";

type PayoutFrequency = "WEEKLY" | "MONTHLY" | "QUARTERLY" | "ANNUALLY";
type FormState = "idle" | "loading" | "success" | "error";

interface FormData {
  group_name: string;
  contribution_amount: string;
  payout_frequency: PayoutFrequency;
}

export default function GroupSettingsPage() {
  const auth = useAuth();
  
  const [form, setForm] = useState<FormData>({
    group_name: "",
    contribution_amount: "",
    payout_frequency: "MONTHLY",
  });
  const [state, setState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [createdGroup, setCreatedGroup] = useState<Record<string, unknown> | null>(null);

  // Role check - redirect non-Admins
  if (auth && auth.role !== "Admin") {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="text-red-600 text-lg font-bold mb-2">Access Denied</div>
          <p className="text-gray-600">Only administrators can access group settings.</p>
        </div>
      </div>
    );
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

 const handleSubmit = async (e: React.MouseEvent) => {
  e.preventDefault();

  if (!form.group_name || !form.contribution_amount || !form.payout_frequency) {
    setErrorMessage("All fields are required.");
    setState("error");
    return;
  }

  if (isNaN(Number(form.contribution_amount)) || Number(form.contribution_amount) <= 0) {
    setErrorMessage("Contribution amount must be a valid positive number.");
    setState("error");
    return;
  }

  setState("loading");
  setErrorMessage("");

  try {
    // Use a hardcoded demo user ID for presentation
    const demoUserId = "demo_user_123";
    
    // Also store the group info in localStorage for dashboard to read
    const newGroup = {
      group_name: form.group_name,
      contribution_amount: Number(form.contribution_amount),
      payout_frequency: form.payout_frequency,
      created_at: new Date().toISOString(),
    };
    
    // Store in localStorage so dashboard can show it
    const existingGroups = JSON.parse(localStorage.getItem('demo_groups') || '[]');
    existingGroups.push(newGroup);
    localStorage.setItem('demo_groups', JSON.stringify(existingGroups));

    const response = await fetch("/api/groups", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-auth-id": demoUserId,
      },
      body: JSON.stringify({
        group_name: form.group_name,
        contribution_amount: Number(form.contribution_amount),
        payout_frequency: form.payout_frequency,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setErrorMessage(data.error || "Something went wrong.");
      setState("error");
      return;
    }

    setCreatedGroup(data.group);
    setState("success");
    setForm({ group_name: "", contribution_amount: "", payout_frequency: "MONTHLY" });
    
    // Reload page after 2 seconds to show new group on dashboard
    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 2000);

  } catch {
    setErrorMessage("Could not connect to the server. Please try again.");
    setState("error");
  }
};


  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Group Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Create and configure your stokvel group.
        </p>
      </div>

      <Card className="max-w-lg p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          Create a New Stokvel Group
        </h2>

        {state === "success" && createdGroup && (
          <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
            <CheckCircle size={18} className="text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-emerald-800">
                Group created successfully!
              </p>
              <p className="text-xs text-emerald-600 mt-0.5">
                {createdGroup.group_name} — {createdGroup.payout_frequency}
              </p>
            </div>
          </div>
        )}

        {state === "error" && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Group Name
            </label>
            <input
              type="text"
              name="group_name"
              value={form.group_name}
              onChange={handleChange}
              placeholder="e.g. Umoja Savings Circle"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Contribution Amount (R)
            </label>
            <input
              type="number"
              name="contribution_amount"
              value={form.contribution_amount}
              onChange={handleChange}
              placeholder="e.g. 500"
              min="1"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Payout Frequency
            </label>
            <select
              name="payout_frequency"
              value={form.payout_frequency}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="ANNUALLY">Annually</option>
            </select>
          </div>

          <button
            onClick={handleSubmit}
            disabled={state === "loading"}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {state === "loading" ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Creating group...
              </>
            ) : (
              "Create Group"
            )}
          </button>
        </div>
      </Card>
    </div>
  );
}
