"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { fetchDashboardStats } from "@/features/dashboard/api";
import type { DashboardStats } from "@/features/dashboard/types";

gsap.registerPlugin(useGSAP);

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    notes: { total: 0, pinned: 0, completed: 0 },
    prompts: { total: 0 },
    assets: { total: 0, totalStorageBytes: 0 }
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    // Fetch unified dashboard stats
    fetchDashboardStats().then(setStats).catch(console.error);
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
        <div className="p-6 border-4 border-black dark:border-neutral-700 bg-yellow-400 transition-colors duration-300 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-black mb-2">Sticky Notes</h3>
            <p className="text-3xl sm:text-4xl font-black text-black">{stats.notes.total}</p>
          </div>
          <p className="text-sm font-bold text-slate-800 mt-4">{stats.notes.total - stats.notes.completed} active · {stats.notes.pinned} pinned</p>
        </div>
        
        <div className="p-6 border-4 border-black dark:border-neutral-700 bg-red-500 transition-colors duration-300 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-black mb-2">Store Prompts</h3>
            <p className="text-3xl sm:text-4xl font-black text-black">{stats.prompts.total}</p>
          </div>
          <p className="text-sm font-bold text-slate-900 mt-4">Saved prompts</p>
        </div>
        
        <div className="p-6 border-4 border-black dark:border-neutral-700 bg-cyan-400 transition-colors duration-300 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-black mb-2">Asset Vault</h3>
            <p className="text-3xl sm:text-4xl font-black text-black">{stats.assets.total}</p>
          </div>
          <p className="text-sm font-bold text-slate-800 mt-4">
            {(stats.assets.totalStorageBytes / (1024 * 1024)).toFixed(2)} MB Storage Used
          </p>
        </div>
      </section>

      {/* Quick Launch Cards */}
      <section>
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-widest border-b-4 border-black dark:border-neutral-700 pb-4 mb-6 sm:mb-8 text-black dark:text-white transition-colors duration-300 gsap-animate">
          Launchpad
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          
          <Link href="/sticky-notes" className="group relative block gsap-animate">
            <div className="absolute inset-0 bg-black dark:bg-neutral-700 translate-y-2 translate-x-2 group-hover:translate-y-1 group-hover:translate-x-1 transition-transform duration-200"></div>
            <div className="relative bg-yellow-400 border-4 border-black dark:border-neutral-700 p-5 sm:p-8 transition-transform duration-200 hover:-translate-y-1 hover:-translate-x-1 active:translate-y-0 active:translate-x-0 h-full flex flex-col">
              <div className="flex-1">
                <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-black mb-3 sm:mb-4">Sticky Notes</h3>
                <p className="text-base sm:text-lg font-bold text-slate-800">Capture your thoughts instantly. Organize your ideas on an infinite canvas.</p>
              </div>
              <div className="mt-6 sm:mt-8 flex items-center gap-2 font-black uppercase tracking-widest text-black text-sm sm:text-base">
                Open App <ArrowRight size={20} strokeWidth={3} />
              </div>
            </div>
          </Link>

          <Link href="/prompt-store" className="group relative block gsap-animate">
            <div className="absolute inset-0 bg-black dark:bg-neutral-700 translate-y-2 translate-x-2 group-hover:translate-y-1 group-hover:translate-x-1 transition-transform duration-200"></div>
            <div className="relative bg-red-500 border-4 border-black dark:border-neutral-700 p-5 sm:p-8 transition-transform duration-200 hover:-translate-y-1 hover:-translate-x-1 active:translate-y-0 active:translate-x-0 h-full flex flex-col">
              <div className="flex-1">
                <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-black mb-3 sm:mb-4">Prompt Store</h3>
                <p className="text-base sm:text-lg font-bold text-slate-900">Your personal library of AI prompts. Save, organize, and reuse your best queries.</p>
              </div>
              <div className="mt-6 sm:mt-8 flex items-center gap-2 font-black uppercase tracking-widest text-black text-sm sm:text-base">
                Open App <ArrowRight size={20} strokeWidth={3} />
              </div>
            </div>
          </Link>

          <Link href="/asset-vault" className="group relative block gsap-animate">
            <div className="absolute inset-0 bg-black dark:bg-neutral-700 translate-y-2 translate-x-2 group-hover:translate-y-1 group-hover:translate-x-1 transition-transform duration-200"></div>
            <div className="relative bg-cyan-400 border-4 border-black dark:border-neutral-700 p-5 sm:p-8 transition-transform duration-200 hover:-translate-y-1 hover:-translate-x-1 active:translate-y-0 active:translate-x-0 h-full flex flex-col">
              <div className="flex-1">
                <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-black mb-3 sm:mb-4">Asset Vault</h3>
                <p className="text-base sm:text-lg font-bold text-slate-800">Secure cloud storage for all your images and PDFs. Streamed directly to Cloudinary.</p>
              </div>
              <div className="mt-6 sm:mt-8 flex items-center gap-2 font-black uppercase tracking-widest text-black text-sm sm:text-base">
                Open App <ArrowRight size={20} strokeWidth={3} />
              </div>
            </div>
          </Link>

          <Link href="/api-ping" className="group relative block gsap-animate">
            <div className="absolute inset-0 bg-black dark:bg-neutral-700 translate-y-2 translate-x-2 group-hover:translate-y-1 group-hover:translate-x-1 transition-transform duration-200"></div>
            <div className="relative bg-emerald-400 border-4 border-black dark:border-neutral-700 p-5 sm:p-8 transition-transform duration-200 hover:-translate-y-1 hover:-translate-x-1 active:translate-y-0 active:translate-x-0 h-full flex flex-col">
              <div className="flex-1">
                <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-black mb-3 sm:mb-4">API Ping</h3>
                <p className="text-base sm:text-lg font-bold text-slate-800">Lightweight built-in Postman client. Quickly test REST endpoints with header and body controls.</p>
              </div>
              <div className="mt-6 sm:mt-8 flex items-center gap-2 font-black uppercase tracking-widest text-black text-sm sm:text-base">
                Open App <ArrowRight size={20} strokeWidth={3} />
              </div>
            </div>
          </Link>

          <Link href="/focus" className="group relative block gsap-animate">
            <div className="absolute inset-0 bg-black dark:bg-neutral-700 translate-y-2 translate-x-2 group-hover:translate-y-1 group-hover:translate-x-1 transition-transform duration-200"></div>
            <div className="relative bg-purple-400 border-4 border-black dark:border-neutral-700 p-5 sm:p-8 transition-transform duration-200 hover:-translate-y-1 hover:-translate-x-1 active:translate-y-0 active:translate-x-0 h-full flex flex-col">
              <div className="flex-1">
                <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-black mb-3 sm:mb-4">Focus Mixer</h3>
                <p className="text-base sm:text-lg font-bold text-slate-850">A premium, stark audio soundscape mixer. Adjust rainfall, cafes, wind, and typing sounds.</p>
              </div>
              <div className="mt-6 sm:mt-8 flex items-center gap-2 font-black uppercase tracking-widest text-black text-sm sm:text-base">
                Open App <ArrowRight size={20} strokeWidth={3} />
              </div>
            </div>
          </Link>

          <Link href="/whiteboard" className="group relative block gsap-animate">
            <div className="absolute inset-0 bg-black dark:bg-neutral-700 translate-y-2 translate-x-2 group-hover:translate-y-1 group-hover:translate-x-1 transition-transform duration-200"></div>
            <div className="relative bg-orange-400 border-4 border-black dark:border-neutral-700 p-5 sm:p-8 transition-transform duration-200 hover:-translate-y-1 hover:-translate-x-1 active:translate-y-0 active:translate-x-0 h-full flex flex-col">
              <div className="flex-1">
                <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-black mb-3 sm:mb-4">Whiteboard</h3>
                <p className="text-base sm:text-lg font-bold text-slate-850">An infinite collaborative canvas. Draw, add shapes, attach sticky notes, and connect ideas.</p>
              </div>
              <div className="mt-6 sm:mt-8 flex items-center gap-2 font-black uppercase tracking-widest text-black text-sm sm:text-base">
                Open App <ArrowRight size={20} strokeWidth={3} />
              </div>
            </div>
          </Link>

        </div>
      </section>

    </div>
  );
}
