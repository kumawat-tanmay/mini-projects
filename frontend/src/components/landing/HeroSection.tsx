"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitTextReveal from "./SplitTextReveal";
import Navbar from "./Navbar";
import HeroCubes from "./HeroCubes";

gsap.registerPlugin(ScrollTrigger);

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Simple entry animation instead of scroll trigger
      gsap.fromTo(textContainerRef.current, 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1, ease: "power3.out", delay: 0.2 }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={containerRef} 
      className="relative w-full h-screen bg-[#0a0a0f] overflow-hidden"
    >
      <div className="w-full h-full relative">
        <Navbar />
        {/* Foreground Typography */}
        <div 
          ref={textContainerRef}
          className="absolute inset-0 z-10 flex flex-col justify-center items-center md:items-start md:pl-20 pointer-events-none"
        >
          <div className="font-black uppercase tracking-tighter text-white mix-blend-difference text-[12vw] leading-[0.85]">
            <SplitTextReveal text="SIMPLIFY" delay={0.2} />
            <SplitTextReveal text="YOUR" delay={0.4} />
            <SplitTextReveal text="DAILY LIFE." delay={0.6} className="text-red-500" />
          </div>

          <div className="mt-12 md:ml-2 text-slate-300 font-medium text-lg md:text-xl max-w-sm">
            <SplitTextReveal 
              text="A minimalist productivity hub designed to organize your day and clear your mind." 
              delay={1.2} 
            />
          </div>
        </div>

        {/* 3D Cubes Background */}
        <HeroCubes />
      </div>
    </section>
  );
}
