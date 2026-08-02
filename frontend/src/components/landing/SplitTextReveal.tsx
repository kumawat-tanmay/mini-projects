"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";

interface SplitTextRevealProps {
  text: string;
  className?: string;
  delay?: number;
}

export default function SplitTextReveal({ text, className = "", delay = 0 }: SplitTextRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Split text into words/lines manually since we don't have GSAP SplitText (Premium)
    const words = containerRef.current.querySelectorAll('.word-inner');
    
    gsap.fromTo(
      words,
      { y: "100%", opacity: 0 },
      { 
        y: "0%", 
        opacity: 1, 
        duration: 1.2, 
        ease: "power4.out", 
        delay 
      }
    );
  }, [delay]);

  // Splitting by spaces to wrap words in overflow-hidden spans
  const wordsArray = text.split(" ");

  return (
    <div ref={containerRef} className={`flex flex-wrap ${className}`}>
      {wordsArray.map((word, index) => (
        <span key={index} className="inline-block overflow-hidden mr-[0.2em] pb-2">
          <span className="inline-block word-inner origin-bottom-left">
            {word}
          </span>
        </span>
      ))}
    </div>
  );
}
