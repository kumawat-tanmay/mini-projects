"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitTextReveal from "./SplitTextReveal";
import Navbar from "./Navbar";

gsap.registerPlugin(ScrollTrigger);

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Parallax scroll effect for the text
      gsap.to(textContainerRef.current, {
        y: -150,
        opacity: 0,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={containerRef} 
      className="relative w-full h-[150vh] bg-[#0a0a0f] overflow-hidden"
    >
      {/* Sticky container holds the Hero content while scrolling through the 150vh */}
      <div className="sticky top-0 w-full h-screen overflow-hidden">
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

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center opacity-50">
          <span className="text-[10px] text-white uppercase tracking-[0.3em] mb-4 font-bold">Scroll</span>
          <div className="w-[1px] h-16 bg-white/30 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-full bg-white animate-[scroll-down_1.5s_ease-in-out_infinite]" />
          </div>
        </div>

      </div>
    </section>
  );
}
