"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, setToken } from "../../utils/api";
import { toast } from "react-toastify";

interface SignupFormProps {
  onSwitch: () => void;
}

export default function SignupForm({ onSwitch }: SignupFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const handleGoogleCredentialResponse = async (response: any) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Google signup failed');

      setToken(data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.dispatchEvent(new Event('auth-change'));
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initGoogle = () => {
      if ((window as any).google && googleBtnRef.current) {
        if (!(window as any).__googleInitialized) {
          (window as any).google.accounts.id.initialize({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
            callback: handleGoogleCredentialResponse,
          });
          (window as any).__googleInitialized = true;
        }
        (window as any).google.accounts.id.renderButton(
          googleBtnRef.current,
          { theme: 'outline', size: 'large', type: 'standard', text: 'continue_with' }
        );
      }
    };

    let intervalId: NodeJS.Timeout;

    const checkAndInitGoogle = () => {
      if ((window as any).google) {
        if (intervalId) clearInterval(intervalId);
        initGoogle();
      }
    };

    if (document.getElementById('gsi-script')) {
      if ((window as any).google) {
        initGoogle();
      } else {
        intervalId = setInterval(checkAndInitGoogle, 100);
      }
    } else {
      const script = document.createElement('script');
      script.id = 'gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = checkAndInitGoogle;
      document.body.appendChild(script);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      const res = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password })
      });
      setToken(res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      toast.success("Account Created! Redirecting...");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6 sm:mb-8 text-center md:text-left">
        <h1 className="text-3xl sm:text-4xl font-black text-black uppercase tracking-tighter mb-2">Create Account</h1>
        <p className="text-slate-600 font-bold text-sm sm:text-base">Join the hub. Master your productivity.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div>
          <label className="block text-sm font-black text-black uppercase tracking-widest mb-2">Full Name</label>
          <input 
            type="text" 
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white text-black px-3 sm:px-4 py-2.5 sm:py-3 text-base sm:text-lg font-bold border-4 border-black outline-none focus:bg-emerald-50 transition-colors"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="block text-sm font-black text-black uppercase tracking-widest mb-2">Email</label>
          <input 
            type="email" 
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white text-black px-3 sm:px-4 py-2.5 sm:py-3 text-base sm:text-lg font-bold border-4 border-black outline-none focus:bg-emerald-50 transition-colors"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-black text-black uppercase tracking-widest mb-2">Password</label>
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white text-black px-3 sm:px-4 py-2.5 sm:py-3 pr-12 text-base sm:text-lg font-bold border-4 border-black outline-none focus:bg-emerald-50 transition-colors"
              placeholder="••••••••"
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-black hover:text-emerald-500 transition-colors"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-.722-3.25"/><path d="M2 8a10.645 10.645 0 0 0 20 0"/><path d="m20 15-1.726-2.05"/><path d="m4 15 1.726-2.05"/><path d="m9 18 .722-3.25"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>
        </div>

        {error && <p className="text-red-600 font-bold bg-red-100 p-2 border-2 border-red-600">{error}</p>}

        <div className="relative group pt-2">
          <div className="absolute inset-0 bg-black translate-y-2 translate-x-2 group-hover:translate-y-1 group-hover:translate-x-1 transition-transform"></div>
          <button 
            type="submit" 
            disabled={isLoading}
            className="relative w-full bg-emerald-400 border-4 border-black text-black font-black uppercase tracking-widest text-base sm:text-lg px-4 sm:px-6 py-3 sm:py-4 outline-none disabled:opacity-70 transition-transform hover:-translate-y-1 hover:-translate-x-1 active:translate-y-0 active:translate-x-0"
          >
            {isLoading ? "Creating..." : "Sign Up"}
          </button>
        </div>
      </form>

      <div className="mt-6 relative group">
        <div className="absolute inset-0 bg-black translate-y-1 translate-x-1 transition-transform"></div>
        <div className="relative w-full h-[52px] bg-white border-4 border-black text-black flex items-center justify-center overflow-hidden transition-transform active:translate-y-0 active:translate-x-0">
          
          {/* Custom Visual Button */}
          <div className="absolute inset-0 flex items-center justify-center gap-3 font-black uppercase tracking-widest text-sm pointer-events-none">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign Up with Google
          </div>

          {/* Invisible Google Native Button Overlay */}
          <div ref={googleBtnRef} className="absolute inset-0 opacity-0 scale-[1.5] cursor-pointer z-10" title="Sign up with Google"></div>
          
        </div>
      </div>

      <div className="mt-8 text-center pb-8">
        <p className="text-black text-sm font-bold">
          Already have an account?{' '}
          <button onClick={onSwitch} className="font-black text-purple-600 hover:text-purple-500 uppercase tracking-widest ml-2 transition-colors">
            Log In
          </button>
        </p>
      </div>
    </div>
  );
}
