import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { Providers } from "./providers";
import "@/lib/db";

export const metadata: Metadata = {
  title: "Tehuacán Brillante - Sistema de Gestión de Producción",
  description: "Aplicación para la gestión de líneas de producción, mapeo de errores de mantenimiento y seguimiento de órdenes de producción.",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link 
          rel="stylesheet" 
          href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&family=Roboto+Mono:wght@400;700&display=swap" 
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased">
        <Providers>
          {children}
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}