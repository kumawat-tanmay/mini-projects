"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { getCookie } from "../../utils/api";

export default function Navbar() {
  const router = useRouter();
  const transitionRef = useRef<HTMLDivElement>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (getCookie('auth_token')) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleNavigation = (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    if (!transitionRef.current) return;
    
    // Play transition animation
    gsap.fromTo(
      transitionRef.current,
      { y: "100%" },
      { 
        y: "0%", 
        duration: 0.6, 
        ease: "power3.inOut",
        onComplete: () => {
          router.push(url);
        }
      }
    );
  };

  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 py-4 md:px-12 md:py-5 pointer-events-auto mix-blend-difference">
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-white rounded-sm" />
          <span className="text-white font-black text-xl tracking-tighter uppercase">ProdHub</span>
        </div>



        {/* Right: 3D Auth Buttons */}
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <a 
              href="/dashboard"
              onClick={(e) => handleNavigation(e, "/dashboard")}
              className="group relative inline-flex items-center justify-center font-black text-white uppercase tracking-widest text-xs md:text-sm outline-none cursor-pointer"
            >
              <span className="absolute inset-0 bg-purple-950 rounded-md transform translate-y-1.5 transition-transform duration-100 ease-out group-hover:translate-y-2 group-active:translate-y-0" />
              <span className="relative bg-purple-500 border-2 border-purple-950 px-4 md:px-6 py-2 md:py-3 rounded-md transform transition-transform duration-100 ease-out group-hover:translate-y-[-2px] group-active:translate-y-0 flex items-center gap-2">
                Dashboard
              </span>
            </a>
          ) : (
            <>
              <a 
                href="/auth?mode=login"
                onClick={(e) => handleNavigation(e, "/auth?mode=login")}
                className="group relative inline-flex items-center justify-center font-black text-white uppercase tracking-widest text-xs md:text-sm outline-none cursor-pointer"
              >
                <span className="absolute inset-0 bg-purple-950 rounded-md transform translate-y-1.5 transition-transform duration-100 ease-out group-hover:translate-y-2 group-active:translate-y-0" />
                <span className="relative bg-purple-500 border-2 border-purple-950 px-4 md:px-6 py-2 md:py-3 rounded-md transform transition-transform duration-100 ease-out group-hover:translate-y-[-2px] group-active:translate-y-0 flex items-center gap-2">
                  Login
                </span>
              </a>

              <a 
                href="/auth?mode=signup" 
                onClick={(e) => handleNavigation(e, "/auth?mode=signup")}
                className="group relative inline-flex items-center justify-center font-black text-white uppercase tracking-widest text-xs md:text-sm outline-none cursor-pointer"
              >
                <span className="absolute inset-0 bg-emerald-950 rounded-md transform translate-y-1.5 transition-transform duration-100 ease-out group-hover:translate-y-2 group-active:translate-y-0" />
                <span className="relative bg-emerald-500 border-2 border-emerald-950 px-4 md:px-6 py-2 md:py-3 rounded-md transform transition-transform duration-100 ease-out group-hover:translate-y-[-2px] group-active:translate-y-0 flex items-center gap-2">
                  Sign Up
                </span>
              </a>
            </>
          )}
        </div>
      </nav>

      {/* Global Page Transition Overlay */}
      <div 
        ref={transitionRef}
        className="fixed inset-0 z-[100] bg-[#0a0a0f] transform translate-y-[100%] pointer-events-none"
      />
    </>
  );
}
