"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";

const CUBE_1 = ["STICKY NOTES", "TEXT EDITOR", "COLOR CODES", "DRAG & DROP", "AUTO SAVE", "BOARD VIEW"];
const CUBE_2 = ["ASSET VAULT", "FILE UPLOAD", "CLOUD DRIVE", "GALLERY", "SECURE", "DOWNLOADS"];
const CUBE_3 = ["PROMPT STORE", "TEMPLATES", "ONE-CLICK COPY", "CATEGORIES", "QUICK SEARCH", "FAVORITES"];
const CUBE_4 = ["FOCUS TIMER", "POMODORO", "TASK TRACK", "TO-DO LIST", "PRODUCTIVITY", "TIME LOGS"];

const SingleCube = ({ words, delay, colorClass }: { words: string[], delay: number, colorClass: string }) => {
  const cubeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cubeRef.current) return;
    
    // Smooth continuous rotation on multiple axes
    gsap.to(cubeRef.current, {
      rotationX: 360,
      rotationY: 360,
      rotationZ: 360,
      duration: 25 + delay * 5,
      repeat: -1,
      ease: "none",
    });
  }, [delay]);

  return (
    <div className="cube-container">
      <div ref={cubeRef} className="cube">
        <div className={`cube-face cube-face-front ${colorClass}`}>{words[0]}</div>
        <div className={`cube-face cube-face-back ${colorClass}`}>{words[1]}</div>
        <div className={`cube-face cube-face-right ${colorClass}`}>{words[2]}</div>
        <div className={`cube-face cube-face-left ${colorClass}`}>{words[3]}</div>
        <div className={`cube-face cube-face-top ${colorClass}`}>{words[4]}</div>
        <div className={`cube-face cube-face-bottom ${colorClass}`}>{words[5]}</div>
      </div>
    </div>
  );
};

export default function HeroCubes() {
  return (
    <div className="absolute inset-y-0 right-0 w-1/2 lg:w-[45%] hidden md:flex flex-col items-center justify-center pointer-events-none z-0">
      {/* Container to stagger the cubes and push them right */}
      <div className="relative w-full h-full flex items-center justify-end pr-10 lg:pr-32">
        <div className="grid grid-cols-2 gap-16 lg:gap-24 transform rotate-12 scale-[0.75] lg:scale-90">
          <div className="mt-32">
            <SingleCube words={CUBE_1} delay={0} colorClass="bg-yellow-400/90 border-yellow-500 text-black" />
          </div>
          <div>
            <SingleCube words={CUBE_2} delay={1} colorClass="bg-cyan-400/90 border-cyan-500 text-black" />
          </div>
          <div className="mt-32">
            <SingleCube words={CUBE_3} delay={2} colorClass="bg-purple-400/90 border-purple-500 text-black" />
          </div>
          <div>
            <SingleCube words={CUBE_4} delay={3} colorClass="bg-rose-400/90 border-rose-500 text-black" />
          </div>
        </div>
      </div>
    </div>
  );
}
