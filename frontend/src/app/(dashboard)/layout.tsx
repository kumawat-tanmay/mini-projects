"use client";

import React, { useState, useEffect } from "react";
import Topbar from "@/components/layout/Topbar";
import Sidebar from "@/components/layout/Sidebar";
import SmoothScrolling from "@/components/layout/SmoothScrolling";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Track viewport width to determine mobile vs desktop
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      // Auto-open sidebar on desktop, auto-close on mobile
      if (!mobile) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => {
    if (isMobile) setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cyan-50 dark:bg-none dark:bg-black text-black dark:text-white transition-colors duration-300">
      <Topbar toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={isSidebarOpen} onNavClick={closeSidebar} />
      
      {/* Mobile Backdrop Overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={closeSidebar}
        />
      )}
      
      {/* Main Content Area */}
      <main className={`pt-16 min-h-screen transition-all duration-300 ${isSidebarOpen && !isMobile ? 'lg:pl-64' : 'pl-0'}`}>
        <SmoothScrolling>
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </SmoothScrolling>
      </main>
    </div>
  );
}
