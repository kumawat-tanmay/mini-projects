"use client";

import React, { useState } from "react";
import Topbar from "@/components/layout/Topbar";
import Sidebar from "@/components/layout/Sidebar";
import SmoothScrolling from "@/components/layout/SmoothScrolling";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cyan-50 dark:bg-none dark:bg-black text-black dark:text-white transition-colors duration-300">
      <Topbar toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={isSidebarOpen} />
      
      {/* Main Content Area */}
      <main className={`pt-16 min-h-screen transition-all duration-300 ${isSidebarOpen ? 'pl-64' : 'pl-0'}`}>
        <SmoothScrolling>
          <div className="p-8">
            {children}
          </div>
        </SmoothScrolling>
      </main>
    </div>
  );
}
