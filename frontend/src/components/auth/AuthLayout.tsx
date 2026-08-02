"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import gsap from "gsap";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import Link from "next/link";

function AuthContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  
  // Initialize state based on URL search params (e.g. ?mode=signup)
  const [isLogin, setIsLogin] = useState(mode !== "signup");
  const overlayRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Page Entrance Animation (slide up black screen to reveal Auth)
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 0.2 }
      );
    }
  }, []);

  useEffect(() => {
    if (!overlayRef.current) return;
    
    // Animate the sliding overlay when toggling modes
    gsap.to(overlayRef.current, {
      x: isLogin ? "0%" : "100%",
      duration: 0.8,
      ease: "power4.inOut",
    });
  }, [isLogin]);

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-white flex overflow-hidden opacity-0">
      

      {/* Left Side (Underneath): Signup Form */}
      <div className="w-full md:w-1/2 h-full flex items-center justify-center p-8 md:p-16">
        <div className={`w-full max-w-md transition-opacity duration-500 delay-300 ${isLogin ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}`}>
          <SignupForm onSwitch={() => setIsLogin(true)} />
        </div>
      </div>

      {/* Right Side (Underneath): Login Form */}
      <div className="w-full md:w-1/2 h-full flex items-center justify-center p-8 md:p-16">
        <div className={`w-full max-w-md transition-opacity duration-500 delay-300 ${isLogin ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <LoginForm onSwitch={() => setIsLogin(false)} />
        </div>
      </div>

      {/* Sliding Image Overlay */}
      <div 
        ref={overlayRef} 
        className="hidden md:block absolute top-0 left-0 w-1/2 h-full z-20 pointer-events-none"
      >
        <div className="relative w-full h-full">
          <div className="w-full h-full overflow-hidden relative shadow-2xl">
            {/* 3D Home Button on Image */}
            <div className="absolute top-8 left-8 z-50 group pointer-events-auto">
              <div className="absolute inset-0 bg-black translate-y-1 translate-x-1 group-hover:translate-y-0.5 group-hover:translate-x-0.5 transition-transform"></div>
              <Link 
                href="/" 
                className="relative bg-white border-4 border-black text-black flex items-center gap-2 px-4 py-2 hover:-translate-y-0.5 hover:-translate-x-0.5 active:translate-y-0 active:translate-x-0 transition-transform"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="font-black tracking-widest uppercase text-xs">Home</span>
              </Link>
            </div>

            {/* The Images (Crossfade based on state) */}
            <img 
              src="https://unsplash.com/photos/xKJ39C-Z9LQ/download?w=1920" 
              alt="Pink Hydrangea" 
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${isLogin ? 'opacity-100' : 'opacity-0'}`}
            />
            <img 
              src="https://unsplash.com/photos/_03pu4Ejg5U/download?w=1920" 
              alt="Desert Dune" 
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${!isLogin ? 'opacity-100' : 'opacity-0'}`}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-black/50 to-black/20" />
            
            <div className="absolute inset-0 flex flex-col items-center justify-end text-center p-8 pb-16 w-full">
              <h2 className="text-6xl xl:text-7xl font-black text-white uppercase tracking-tighter mb-4 drop-shadow-2xl w-full whitespace-nowrap">
                {isLogin ? "Welcome Back." : "Start Your Journey."}
              </h2>
              <p className="text-slate-200 font-bold text-xl w-full px-4 drop-shadow-lg">
                {isLogin 
                  ? "Pick up where you left off. Your workspace is ready." 
                  : "Organize your life, clear your mind, and elevate your focus."}
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

export default function AuthLayout() {
  return (
    <Suspense fallback={<div className="w-full h-screen bg-[#0a0a0f]" />}>
      <AuthContent />
    </Suspense>
  );
}
