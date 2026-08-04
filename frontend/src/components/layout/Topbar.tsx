"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { Sun, Moon, User, LogOut, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { apiFetch } from "../../utils/api";

export default function Topbar({ toggleSidebar }: { toggleSidebar?: () => void }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState(new Date());
  const [userProfile, setUserProfile] = useState<{name: string, email: string} | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setTime(new Date()), 1000);
    
    // Fetch real user data
    apiFetch('/auth/me')
      .then(res => {
        if (res && res.email) {
          setUserProfile({ name: res.name || 'User', email: res.email });
        }
      })
      .catch(console.error);

    return () => clearInterval(timer);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleLogout = () => {
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = "/auth";
  };

  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Dashboard";
    if (pathname === "/sticky-notes") return "Sticky Notes";
    if (pathname === "/prompt-store") return "Prompt Store";
    if (pathname === "/asset-vault") return "Asset Vault";
    return "Productivity Hub";
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-40 flex items-center justify-between transition-colors duration-300">
      
      {/* Left side: Logo / Brand & Page Title */}
      <div className="flex items-center h-full">
        <div className="flex items-center gap-4 w-64 px-6 h-full border-r border-slate-200 dark:border-slate-800 shrink-0">
          <button 
            onClick={toggleSidebar} 
            className="p-1 -ml-1 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            aria-label="Toggle Sidebar"
          >
            <Menu size={24} strokeWidth={2.5} />
          </button>
          <span className="font-black uppercase tracking-widest text-black dark:text-white text-lg leading-none">
            NexTool
          </span>
        </div>
        
        <div className="px-6 flex items-center h-full">
          <h1 className="text-xl font-black uppercase tracking-widest text-black dark:text-white transition-colors duration-300">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Right side: Time, Theme, Profile, Logout */}
      <div className="flex items-center gap-6 px-6 h-full">
        
        {/* Time Widget */}
        {mounted && (
          <div className="hidden md:flex flex-col items-end text-black dark:text-white transition-colors duration-300">
            <span className="text-xs font-bold uppercase tracking-widest">
              {time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
            <span className="text-sm font-black tracking-wider">
              {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2 border-2 border-transparent hover:border-black dark:hover:border-white transition-colors text-black dark:text-white"
          aria-label="Toggle Theme"
        >
          {mounted ? (theme === "dark" ? <Sun size={20} strokeWidth={2.5} /> : <Moon size={20} strokeWidth={2.5} />) : <div className="w-5 h-5"></div>}
        </button>

        {/* Profile Dropdown */}
        <div className="relative group">
          <button className="flex items-center justify-center w-10 h-10 rounded-full bg-black dark:bg-white text-white dark:text-black font-black uppercase overflow-hidden border-2 border-transparent group-hover:border-black/20 dark:group-hover:border-white/20 transition-all">
            <span>{userProfile ? userProfile.name.substring(0, 2) : 'U'}</span>
          </button>

          {/* Dropdown Menu (visible on hover) */}
          <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-900 border-4 border-black dark:border-neutral-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <div className="px-4 py-3 border-b-4 border-black dark:border-neutral-700">
              <p className="font-black text-sm text-black dark:text-white truncate">
                {userProfile ? userProfile.name : 'Loading...'}
              </p>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 truncate">
                {userProfile ? userProfile.email : ''}
              </p>
            </div>
            <div className="p-2">
              <button className="w-full text-left px-3 py-2 font-black text-xs text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors uppercase tracking-widest border-2 border-transparent hover:border-black dark:hover:border-white">
                My Profile
              </button>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button 
          onClick={handleLogout}
          className="relative group ml-2"
        >
          <div className="absolute inset-0 bg-black dark:bg-neutral-700 translate-y-1 translate-x-1 group-hover:translate-y-0.5 group-hover:translate-x-0.5 transition-transform duration-200"></div>
          <div className="relative bg-white dark:bg-black text-black dark:text-white border-2 border-black dark:border-neutral-700 px-4 py-2 flex items-center gap-2 transition-transform duration-200 hover:-translate-y-0.5 hover:-translate-x-0.5 active:translate-y-0 active:translate-x-0">
            <LogOut size={16} strokeWidth={2.5} />
            <span className="font-black uppercase tracking-widest text-xs">Logout</span>
          </div>
        </button>
      </div>
    </header>
  );
}
