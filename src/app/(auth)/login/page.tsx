"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, LogIn, Mail } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Por favor ingresa tu email y contraseña");
      toast.error("Por favor ingresa tu email y contraseña");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Credenciales inválidas");
        toast.error("Credenciales inválidas");
        return;
      }

      toast.success("Inicio de sesión exitoso");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error(error);
      setError("Ocurrió un error al iniciar sesión");
      toast.error("Ocurrió un error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-white to-primary/10 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col items-center justify-center mb-8">
              <div className="w-full flex justify-center items-center mb-4">
                <div className="h-16 w-16 bg-gradient-to-br from-primary to-secondary rounded-xl shadow-lg flex items-center justify-center text-white text-2xl font-bold mb-2">
                  TB
                </div>
              </div>
              <h1 className="text-2xl font-bold text-secondary text-center">Tehuacán Brillante</h1>
              <p className="text-gray-600 text-center mt-1">Sistema de Gestión de Producción</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 text-sm font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-900">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="pl-10 bg-gray-50 border border-gray-300 text-gray-900 focus:ring-primary focus:border-primary"
                    disabled={isLoading}
                  />
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-900">
                    Contraseña
                  </label>
                  <a href="#" className="text-sm font-medium text-primary hover:text-primary/80">
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-gray-50 border border-gray-300 text-gray-900 focus:ring-primary focus:border-primary"
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-white font-medium shadow-sm"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" /> Iniciar Sesión
                  </>
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-gray-600">
              Al iniciar sesión, aceptas nuestros{" "}
              <a href="#" className="font-medium text-primary hover:text-primary/80">
                Términos y Condiciones
              </a>{" "}
              y{" "}
              <a href="#" className="font-medium text-primary hover:text-primary/80">
                Política de Privacidad
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 