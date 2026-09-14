"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SuggestionModal from "@/components/ui/SuggestionModal";
import { 
  LayoutDashboard, 
  StickyNote, 
  Sparkles, 
  Trello, 
  CalendarDays, 
  Timer,
  Database,
  Volume2,
  PenTool,
  Linkedin
} from "lucide-react";

interface SidebarProps {
  isOpen?: boolean;
  onNavClick?: () => void;
}

export default function Sidebar({ isOpen = true, onNavClick }: SidebarProps) {
  const pathname = usePathname();
  const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);

  const mainLinks = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Sticky Notes", href: "/sticky-notes", icon: StickyNote },
    { name: "Prompt Store", href: "/prompt-store", icon: Sparkles },
    { name: "Asset Vault", href: "/asset-vault", icon: Database },
    { name: "Focus Mixer", href: "/focus", icon: Volume2 },
    { name: "Whiteboard", href: "/whiteboard", icon: PenTool },
    { name: "LinkedIn Post", href: "/linkedin", icon: Linkedin },
  ];

  return (
    <aside className={`fixed top-16 left-0 bottom-0 w-64 bg-white/95 dark:bg-black/95 lg:bg-white/80 lg:dark:bg-black/80 backdrop-blur-md border-r border-slate-200 dark:border-slate-800 z-40 lg:z-30 flex flex-col transition-all duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      
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
                  onClick={onNavClick}
                  className={`flex items-center gap-3 px-4 py-3 font-bold uppercase tracking-wider text-sm transition-colors border-2 ${
                    isActive 
                      ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-neutral-700" 
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
          <div className="px-4">
            <button
              className="w-full flex flex-col items-center justify-center gap-2 py-6 px-4 bg-transparent text-slate-400 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition-all font-black uppercase tracking-widest text-xs"
              onClick={() => setIsSuggestionModalOpen(true)}
            >
              <Sparkles size={20} className="mb-1" />
              <span>Suggest More</span>
              <span>Ideas For All</span>
            </button>
          </div>
        </div>

      </div>

      <SuggestionModal 
        isOpen={isSuggestionModalOpen} 
        onClose={() => setIsSuggestionModalOpen(false)} 
      />
    </aside>
  );
}
