"use client";

import React, { useState } from "react";
import { apiFetch } from "../../utils/api";
import { toast } from "react-toastify";

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export default function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      const res = await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email })
      });
      toast.success(res.message || "Reset link sent to your email.");
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8 text-center md:text-left">
        <h1 className="text-4xl font-black text-black uppercase tracking-tighter mb-2">Reset Password</h1>
        <p className="text-slate-600 font-bold text-base">Enter your email to receive a reset link.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-black text-black uppercase tracking-widest mb-2">Email</label>
          <input 
            type="email" 
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white text-black px-4 py-3 text-lg font-bold border-4 border-black outline-none focus:bg-purple-50 transition-colors"
            placeholder="you@example.com"
          />
        </div>

        {error && <p className="text-red-600 font-bold bg-red-100 p-2 border-2 border-red-600">{error}</p>}

        <div className="relative group pt-2">
          <div className="absolute inset-0 bg-black translate-y-2 translate-x-2 group-hover:translate-y-1 group-hover:translate-x-1 transition-transform"></div>
          <button 
            type="submit" 
            disabled={isLoading}
            className="relative w-full bg-purple-400 border-4 border-black text-black font-black uppercase tracking-widest text-lg px-6 py-4 outline-none disabled:opacity-70 transition-transform hover:-translate-y-1 hover:-translate-x-1 active:translate-y-0 active:translate-x-0"
          >
            {isLoading ? "Sending..." : "Send Reset Link"}
          </button>
        </div>
      </form>

      <div className="mt-8 text-center pb-8">
        <button onClick={onBack} className="font-black text-slate-500 hover:text-black uppercase tracking-widest transition-colors">
          &larr; Back to Login
        </button>
      </div>
    </div>
  );
}
