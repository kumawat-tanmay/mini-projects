"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  StickyNote, 
  Sparkles, 
  Trello, 
  CalendarDays, 
  Timer 
} from "lucide-react";

export default function Sidebar({ isOpen = true }: { isOpen?: boolean }) {
  const pathname = usePathname();

  const mainLinks = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Sticky Notes", href: "/sticky-notes", icon: StickyNote },
    { name: "Store Prompts", href: "/store-prompts", icon: Sparkles },
  ];

  const comingSoonLinks = [
    { name: "Kanban Board", href: "#", icon: Trello },
    { name: "Calendar", href: "#", icon: CalendarDays },
    { name: "Focus Timer", href: "#", icon: Timer },
  ];

  return (
    <aside className={`fixed top-16 left-0 bottom-0 w-64 bg-white/80 dark:bg-black/80 backdrop-blur-md border-r border-slate-200 dark:border-slate-800 z-30 flex flex-col transition-all duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      
      <div className="flex-1 overflow-y-auto p-4 py-8 space-y-8">
        
        {/* Main Links */}
        <div>
          <nav className="space-y-2">
            {mainLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link 
                  key={link.name} 
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 font-bold uppercase tracking-wider text-sm transition-colors border-2 ${
                    isActive 
                      ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white" 
                      : "bg-transparent text-black dark:text-white border-transparent hover:border-black dark:hover:border-white"
                  }`}
                >
                  <Icon size={18} strokeWidth={isActive ? 3 : 2} />
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Coming Soon Links */}
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4 px-4">
            Coming Soon
          </h3>
          <nav className="space-y-2 opacity-50">
            {comingSoonLinks.map((link) => {
              const Icon = link.icon;
              return (
                <div 
                  key={link.name}
                  className="flex items-center justify-between px-4 py-3 text-sm text-black dark:text-white"
                >
                  <div className="flex items-center gap-3 font-bold uppercase tracking-wider">
                    <Icon size={18} strokeWidth={2} />
                    {link.name}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-tighter bg-black text-white dark:bg-white dark:text-black px-2 py-0.5">
                    Soon
                  </span>
                </div>
              );
            })}
          </nav>
        </div>

      </div>

    </aside>
  );
}
