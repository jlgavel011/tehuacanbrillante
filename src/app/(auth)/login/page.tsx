"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Image from "next/image";
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

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (error) {
      console.error(error);
      toast.error("Error al iniciar sesión con Google");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    try {
      setIsLoading(true);
      setEmail("invitado@tehuacanbrillante.com");
      setPassword("invitado123");
      
      const result = await signIn("credentials", {
        email: "invitado@tehuacanbrillante.com",
        password: "invitado123",
        redirect: false,
      });

      if (result?.error) {
        setError("Error al iniciar como invitado");
        toast.error("Error al iniciar como invitado");
        return;
      }

      toast.success("Inicio como invitado exitoso");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error(error);
      setError("Ocurrió un error al iniciar como invitado");
      toast.error("Error al iniciar como invitado");
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

            <div className="relative mt-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">o continúa con</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-900 font-medium"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                    <path
                      fill="#4285F4"
                      d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
                    />
                    <path
                      fill="#34A853"
                      d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"
                    />
                  </g>
                </svg>
                Google
              </Button>

              <Button
                variant="outline"
                className="bg-secondary hover:bg-secondary/90 text-white font-medium"
                onClick={handleGuestSignIn}
                disabled={isLoading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Invitado
              </Button>
            </div>

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