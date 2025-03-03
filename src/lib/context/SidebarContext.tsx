"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type SidebarContextType = {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  openSidebar: () => void;
  isMobile: boolean;
};

const SidebarContext = createContext<SidebarContextType>({
  sidebarOpen: true,
  toggleSidebar: () => {},
  closeSidebar: () => {},
  openSidebar: () => {},
  isMobile: false,
});

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  // Default to closed on mobile, open on desktop
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);

  // Handle window resize to automatically adjust sidebar state
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Only auto-close on resize if we're switching to mobile
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    // Set initial state based on screen size
    if (typeof window !== 'undefined') {
      handleResize();
      window.addEventListener("resize", handleResize);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener("resize", handleResize);
      }
    };
  }, []);

  // Handle route changes - close sidebar on mobile when navigating
  useEffect(() => {
    const handleRouteChange = () => {
      if (isMobile) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [isMobile]);

  // Handle swipe gestures on mobile
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleTouchStart = (e: TouchEvent) => {
      setTouchStartX(e.touches[0].clientX);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX;
      const deltaX = touchEndX - touchStartX;
      
      // Swipe right to open sidebar (when near left edge)
      if (deltaX > 70 && touchStartX < 30 && !sidebarOpen) {
        setSidebarOpen(true);
      }
      
      // Swipe left to close sidebar
      if (deltaX < -70 && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    // Add touch event listeners
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [sidebarOpen, touchStartX]);

  // Handle document clicks to close sidebar when clicking outside
  useEffect(() => {
    if (typeof window === 'undefined' || !isMobile) return;

    const handleDocumentClick = (e: MouseEvent) => {
      // Check if sidebar is open and click is outside the sidebar
      if (sidebarOpen) {
        // Get the sidebar element
        const sidebar = document.querySelector('[data-sidebar]');
        if (sidebar && !sidebar.contains(e.target as Node)) {
          setSidebarOpen(false);
        }
      }
    };

    document.addEventListener('click', handleDocumentClick);
    
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [sidebarOpen, isMobile]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };
  
  const openSidebar = () => {
    setSidebarOpen(true);
  };

  return (
    <SidebarContext.Provider value={{ sidebarOpen, toggleSidebar, closeSidebar, openSidebar, isMobile }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => useContext(SidebarContext); 