"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { fetchNoteStats } from "@/features/sticky-notes/api";
import type { NoteStats } from "@/features/sticky-notes/types";

gsap.registerPlugin(useGSAP);

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [noteStats, setNoteStats] = useState<NoteStats>({ total: 0, pinned: 0, completed: 0, max: 30 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    // Fetch live note stats
    fetchNoteStats().then(setNoteStats).catch(() => {});
  }, []);

  useGSAP(() => {
    if (mounted && containerRef.current) {
      gsap.from(".gsap-animate", {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power4.out",
        clearProps: "all"
      });
    }
  }, { dependencies: [mounted], scope: containerRef });

  if (!mounted) return null;

  return (
    <div ref={containerRef} className="w-full space-y-12">
      
      {/* Quick Stats / Overview Widget */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 gsap-animate">
        <div className="p-6 border-4 border-black dark:border-white bg-yellow-400 transition-colors duration-300">
          <h3 className="text-sm font-black uppercase tracking-widest text-black mb-2">Sticky Notes</h3>
          <p className="text-4xl font-black text-black">{noteStats.total}</p>
          <p className="text-sm font-bold text-slate-800 mt-1">{noteStats.total - noteStats.completed} active · {noteStats.pinned} pinned</p>
        </div>
        <div className="p-6 border-4 border-black dark:border-white bg-red-500 transition-colors duration-300">
          <h3 className="text-sm font-black uppercase tracking-widest text-black mb-2">Store Prompts</h3>
          <p className="text-4xl font-black text-black">0</p>
          <p className="text-sm font-bold text-slate-900 mt-1">Saved prompts</p>
        </div>
        <div className="p-6 border-4 border-black dark:border-white bg-emerald-500 transition-colors duration-300 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-black mb-2">System Status</h3>
            <p className="text-xl font-black text-emerald-950">Online & Ready</p>
          </div>
        </div>
      </section>

      {/* Quick Launch Cards */}
      <section>
        <h2 className="text-2xl font-black uppercase tracking-widest border-b-4 border-black dark:border-white pb-4 mb-8 text-black dark:text-white transition-colors duration-300 gsap-animate">
          Launchpad
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <Link href="/sticky-notes" className="group relative block gsap-animate">
            <div className="absolute inset-0 bg-black dark:bg-white translate-y-2 translate-x-2 group-hover:translate-y-1 group-hover:translate-x-1 transition-transform duration-200"></div>
            <div className="relative bg-yellow-400 border-4 border-black dark:border-white p-8 transition-transform duration-200 hover:-translate-y-1 hover:-translate-x-1 active:translate-y-0 active:translate-x-0 h-full flex flex-col">
              <div className="flex-1">
                <h3 className="text-3xl font-black uppercase tracking-tighter text-black mb-4">Sticky Notes</h3>
                <p className="text-lg font-bold text-slate-800">Capture your thoughts instantly. Organize your ideas on an infinite canvas.</p>
              </div>
              <div className="mt-8 flex items-center gap-2 font-black uppercase tracking-widest text-black">
                Open App <ArrowRight size={20} strokeWidth={3} />
              </div>
            </div>
          </Link>

          <Link href="/store-prompts" className="group relative block gsap-animate">
            <div className="absolute inset-0 bg-black dark:bg-white translate-y-2 translate-x-2 group-hover:translate-y-1 group-hover:translate-x-1 transition-transform duration-200"></div>
            <div className="relative bg-red-500 border-4 border-black dark:border-white p-8 transition-transform duration-200 hover:-translate-y-1 hover:-translate-x-1 active:translate-y-0 active:translate-x-0 h-full flex flex-col">
              <div className="flex-1">
                <h3 className="text-3xl font-black uppercase tracking-tighter text-black mb-4">Store Prompts</h3>
                <p className="text-lg font-bold text-slate-900">Your personal library of AI prompts. Save, organize, and reuse your best queries.</p>
              </div>
              <div className="mt-8 flex items-center gap-2 font-black uppercase tracking-widest text-black">
                Open App <ArrowRight size={20} strokeWidth={3} />
              </div>
            </div>
          </Link>

        </div>
      </section>

    </div>
  );
}
