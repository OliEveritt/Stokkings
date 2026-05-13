/**
 * US-3.6: Edit Profile Information
 * This component allows users to edit their profile information
 * Accessed from the dropdown menu in the header
 */

"use client";

import { useState, useEffect } from "react";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { X, Save, Loader2 } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { updateEmail, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated: () => void;
}

export default function EditProfileModal({ isOpen, onClose, onProfileUpdated }: EditProfileModalProps) {
  const { user, refreshUser } = useFirebaseAuth();
  
  // Form state
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState(""); // For re-authentication
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPasswordField, setShowPasswordField] = useState(false);

  // Load current user data when modal opens
  useEffect(() => {
    if (user && isOpen) {
      // Split name into first name and surname (assuming format: "firstName surname")
      const nameParts = user.name?.split(" ") || [];
      setName(nameParts[0] || "");
      setSurname(nameParts.slice(1).join(" ") || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setError("");
      setSuccess("");
      setShowPasswordField(false);
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  // Validate phone number (10 digits)
  const isValidPhone = (phoneNum: string) => {
    return /^\d{10}$/.test(phoneNum);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // Validation
    if (phone && !isValidPhone(phone)) {
      setError("Phone number must be exactly 10 digits");
      setLoading(false);
      return;
    }

    try {
      const fullName = `${name} ${surname}`.trim();
      const updates: any = {};

      // Update Firestore fields that have changed
      if (fullName !== user?.name) updates.name = fullName;
      if (phone !== user?.phone) updates.phone = phone;

      // Handle email change (requires re-authentication)
      if (email !== user?.email) {
        if (!password) {
          setError("Please enter your password to change email address");
          setShowPasswordField(true);
          setLoading(false);
          return;
        }

        // Re-authenticate user before changing email
        const currentUser = auth.currentUser;
        if (currentUser && currentUser.email) {
          const credential = EmailAuthProvider.credential(currentUser.email, password);
          await reauthenticateWithCredential(currentUser, credential);
          await updateEmail(currentUser, email);
          updates.email = email;
        }
      }

      // Update Firestore if there are changes
      if (Object.keys(updates).length > 0 && user?.uid) {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, updates);
      }

      // Refresh the user context to update UI
      await refreshUser();
      
      setSuccess("Profile updated successfully!");
      setPassword("");
      setShowPasswordField(false);
      
      // Notify parent component to refresh
      onProfileUpdated();
      
      // Close modal after 1.5 seconds
      setTimeout(() => {
        onClose();
        setSuccess("");
      }, 1500);
    } catch (err: any) {
      console.error("Error updating profile:", err);
      if (err.code === "auth/wrong-password") {
        setError("Incorrect password. Please try again.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("This email is already in use by another account.");
      } else {
        setError(err.message || "Failed to update profile");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
              {success}
            </div>
          )}

          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
              placeholder="Enter your first name"
            />
          </div>

          {/* Surname Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Surname <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
              placeholder="Enter your surname"
            />
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
              placeholder="Enter your email"
            />
            <p className="text-xs text-gray-500 mt-1">
              Changing email requires re-authentication with your password
            </p>
          </div>

          {/* Password Field (shown when changing email) */}
          {showPasswordField && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={showPasswordField}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                placeholder="Enter your password to confirm email change"
              />
            </div>
          )}

          {/* Phone Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
              placeholder="10-digit phone number"
            />
            <p className="text-xs text-gray-500 mt-1">
              Must be exactly 10 digits (e.g., 0821234567)
            </p>
          </div>

          {/* Modal Footer */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
