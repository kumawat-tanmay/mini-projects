"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "../../../utils/api";
import Link from "next/link";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword })
      });
      setMessage(res.message || "Password reset successful.");
    } catch (err: any) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="w-full h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-black text-black uppercase mb-4">Invalid Link</h1>
          <p className="text-slate-500 font-bold mb-8">This password reset link is invalid or missing the token.</p>
          <Link href="/auth?mode=login" className="bg-gray-100 neo-raised text-purple-600 font-black uppercase px-6 py-4 rounded-xl">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gray-100 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-black uppercase tracking-tighter mb-4">New Password</h1>
          <p className="text-black font-bold text-lg">Enter your new secure password.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block text-base font-black text-black uppercase tracking-widest mb-3">New Password</label>
            <input 
              type="password" 
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-gray-100 neo-inset text-black px-5 py-4 text-lg font-bold rounded-xl outline-none focus:ring-2 focus:ring-purple-400/50 transition-all"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-base font-black text-black uppercase tracking-widest mb-3">Confirm Password</label>
            <input 
              type="password" 
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-gray-100 neo-inset text-black px-5 py-4 text-lg font-bold rounded-xl outline-none focus:ring-2 focus:ring-purple-400/50 transition-all"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-500 font-bold">{error}</p>}
          {message && (
            <div className="text-center">
              <p className="text-emerald-500 font-bold mb-6">{message}</p>
              <Link href="/auth?mode=login" className="text-purple-600 font-black uppercase hover:underline">
                Return to Login &rarr;
              </Link>
            </div>
          )}

          {!message && (
            <button 
              type="submit" 
              disabled={isLoading}
              className="group relative w-full bg-gray-100 neo-raised text-purple-600 font-black uppercase tracking-widest text-lg rounded-xl px-6 py-5 mt-6 outline-none disabled:opacity-70 transition-all"
            >
              {isLoading ? "Saving..." : "Save Password"}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="w-full h-screen bg-gray-100" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
