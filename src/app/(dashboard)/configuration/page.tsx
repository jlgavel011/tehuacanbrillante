"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { UserManagement } from "@/app/(dashboard)/configuration/components/user-management";
import { ProfileSettings } from "@/app/(dashboard)/configuration/components/profile-settings";

// Define an extended user type that includes the isMaster property
interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null;
  isMaster?: boolean;
}

export default function ConfigurationPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState("profile");

  // Cast the user to the extended type to ensure isMaster is recognized
  const user = session?.user as ExtendedUser | undefined;

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Cargando...</h2>
          <p className="text-muted-foreground">Por favor espere</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">
          Administre su perfil y configuración de la cuenta
        </p>
      </div>

      <Separator className="my-6" />

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          {/* Only show the Users tab if the user is a master admin */}
          {user?.isMaster && (
            <TabsTrigger value="users">Administración de Usuarios</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Perfil</CardTitle>
              <CardDescription>
                Actualice su información de perfil y preferencias de cuenta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileSettings />
            </CardContent>
          </Card>
        </TabsContent>

        {user?.isMaster && (
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Administración de Usuarios</CardTitle>
                <CardDescription>
                  Administre los usuarios y sus permisos en el sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserManagement />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
} 