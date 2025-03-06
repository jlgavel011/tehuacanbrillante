"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";

type SidebarContextType = {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  openSidebar: () => void;
  isMobile: boolean;
  sidebarHidden: boolean;
};

const SidebarContext = createContext<SidebarContextType>({
  sidebarOpen: true,
  toggleSidebar: () => {},
  closeSidebar: () => {},
  openSidebar: () => {},
  isMobile: false,
  sidebarHidden: false,
});

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  // Default to closed on mobile, open on desktop
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);
  const { data: session } = useSession();
  
  // Check if the user has the PRODUCTION_CHIEF role to hide the sidebar
  const sidebarHidden = session?.user?.role === "PRODUCTION_CHIEF";

  // Handle window resize to automatically adjust sidebar state
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Only auto-close on resize if we're switching to mobile
      if (mobile) {
        setSidebarOpen(false);
      } else {
        // Only open sidebar on desktop if it's not hidden for PRODUCTION_CHIEF role
        if (!sidebarHidden) {
          setSidebarOpen(true);
        }
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
  }, [sidebarHidden]);

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
    if (typeof window === 'undefined' || sidebarHidden) return;

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
  }, [sidebarOpen, touchStartX, sidebarHidden]);

  // Handle document clicks to close sidebar when clicking outside
  useEffect(() => {
    if (typeof window === 'undefined' || !isMobile || sidebarHidden) return;

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
  }, [sidebarOpen, isMobile, sidebarHidden]);

  const toggleSidebar = () => {
    if (!sidebarHidden) {
      setSidebarOpen(!sidebarOpen);
    }
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };
  
  const openSidebar = () => {
    if (!sidebarHidden) {
      setSidebarOpen(true);
    }
  };

  return (
    <SidebarContext.Provider value={{ sidebarOpen, toggleSidebar, closeSidebar, openSidebar, isMobile, sidebarHidden }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => useContext(SidebarContext); 