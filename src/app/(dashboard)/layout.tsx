"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { SidebarProvider } from "@/lib/context/SidebarContext";
import { useSidebar } from "@/lib/context/SidebarContext";
import { DateRangeProvider } from "@/context/DateRangeContext";
import { NotificationProvider } from "@/lib/context/NotificationContext";
import OrderNotificationListener from "@/components/notifications/OrderNotificationListener";
import { ActiveOrderRedirect } from "@/components/ActiveOrderRedirect";

// Inner component to use the sidebar context
function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const { sidebarOpen, sidebarHidden } = useSidebar();
  
  // Verificar si el usuario es administrador (MASTER_ADMIN o MANAGER)
  const isAdmin = session?.user?.role === "MASTER_ADMIN" || session?.user?.role === "MANAGER";
  
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          !sidebarHidden && sidebarOpen ? 'md:ml-64' : (!sidebarHidden ? 'md:ml-20' : 'ml-0')
        }`}
      >
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
      {/* Cargar el listener de notificaciones para todos los usuarios, 
          el componente filtra internamente según el rol */}
      <OrderNotificationListener />
      <ActiveOrderRedirect />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <NotificationProvider>
        <DateRangeProvider>
          <DashboardLayoutInner>{children}</DashboardLayoutInner>
        </DateRangeProvider>
      </NotificationProvider>
    </SidebarProvider>
  );
} 