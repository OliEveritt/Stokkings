"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";

interface FormData {
  group_name: string;
  contribution_amount: string;
  payout_frequency: string;
  payout_order: string;
}

interface FormErrors {
  group_name?: string;
  contribution_amount?: string;
  payout_frequency?: string;
  payout_order?: string;
}

export default function CreateGroupPage() {
  const auth = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    group_name: "",
    contribution_amount: "",
    payout_frequency: "monthly",
    payout_order: "rotational",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // UAT 2: Role guard - redirect non-admins
  if (auth && auth.role !== "Admin") {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⛔</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">
            Only administrators can create new stokvel groups.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // UAT 3: Validation for missing required fields
    if (!formData.group_name.trim()) {
      newErrors.group_name = "Group name is required";
    }

    const amount = parseFloat(formData.contribution_amount);
    if (!formData.contribution_amount) {
      newErrors.contribution_amount = "Contribution amount is required";
    } else if (isNaN(amount) || amount <= 0) {
      newErrors.contribution_amount = "Please enter a valid amount greater than 0";
    }

    if (!formData.payout_frequency) {
      newErrors.payout_frequency = "Payout frequency is required";
    }

    if (!formData.payout_order) {
      newErrors.payout_order = "Payout order is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          group_name: formData.group_name.trim(),
          contribution_amount: parseFloat(formData.contribution_amount),
          payout_frequency: formData.payout_frequency,
          payout_order: formData.payout_order,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // UAT 1: Success - redirect to dashboard
        router.push("/dashboard?success=group_created");
      } else {
        setError(data.error || "Failed to create group");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create New Stokvel Group</h1>
        <p className="text-gray-500 mt-1">
          Set up a new savings group for your community
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 space-y-5">
        {/* Group Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Group Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="group_name"
            value={formData.group_name}
            onChange={handleChange}
            placeholder="e.g., Soweto Savings Stokvel"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.group_name ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.group_name && (
            <p className="mt-1 text-sm text-red-500">{errors.group_name}</p>
          )}
        </div>

        {/* Contribution Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contribution Amount <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R</span>
            <input
              type="number"
              name="contribution_amount"
              value={formData.contribution_amount}
              onChange={handleChange}
              placeholder="500"
              step="0.01"
              min="0"
              className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.contribution_amount ? "border-red-500" : "border-gray-300"
              }`}
            />
          </div>
          {errors.contribution_amount && (
            <p className="mt-1 text-sm text-red-500">{errors.contribution_amount}</p>
          )}
        </div>

        {/* Payout Frequency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payout Frequency <span className="text-red-500">*</span>
          </label>
          <select
            name="payout_frequency"
            value={formData.payout_frequency}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.payout_frequency ? "border-red-500" : "border-gray-300"
            }`}
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
          </select>
          {errors.payout_frequency && (
            <p className="mt-1 text-sm text-red-500">{errors.payout_frequency}</p>
          )}
        </div>

        {/* Payout Order */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payout Order <span className="text-red-500">*</span>
          </label>
          <select
            name="payout_order"
            value={formData.payout_order}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.payout_order ? "border-red-500" : "border-gray-300"
            }`}
          >
            <option value="rotational">Rotational (Round Robin)</option>
            <option value="random">Random</option>
            <option value="fixed">Fixed Order</option>
          </select>
          {errors.payout_order && (
            <p className="mt-1 text-sm text-red-500">{errors.payout_order}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Creating Group..." : "Create Stokvel Group"}
          </button>
        </div>
      </form>
    </div>
  );
}
