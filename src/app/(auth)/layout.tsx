"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Toaster } from "sonner";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center">
          <div className="flex items-center space-x-2">
            <div className="h-7 w-2 bg-primary rounded-l-md"></div>
            <span className="font-bold text-secondary text-lg">Tehuacán Brillante</span>
          </div>
        </div>
      </header>
      
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>
      
      <footer className="py-4 bg-white border-t border-gray-200">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-700 text-sm">
            © {new Date().getFullYear()} Tehuacán Brillante. Todos los derechos reservados.
          </p>
        </div>
      </footer>
      
      <Toaster richColors position="top-center" />
    </div>
  );
} 