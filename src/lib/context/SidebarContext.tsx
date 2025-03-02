"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type SidebarContextType = {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextType>({
  sidebarOpen: true,
  toggleSidebar: () => {},
  closeSidebar: () => {},
});

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  // Default to open on larger screens, closed on mobile
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Handle window resize to automatically close sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    // Set initial state based on screen size
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <SidebarContext.Provider value={{ sidebarOpen, toggleSidebar, closeSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => useContext(SidebarContext); 