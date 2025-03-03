"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Define the extended session type
interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
  isMaster: boolean;
}

// Define the user type
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isMaster: boolean;
  createdAt: string;
}

// Form schema for creating/editing users
const userFormSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  email: z.string().email({
    message: "Por favor ingrese un correo electrónico válido.",
  }),
  password: z.string().min(8, {
    message: "La contraseña debe tener al menos 8 caracteres.",
  }).optional(),
  role: z.enum(["MASTER_ADMIN", "MANAGER", "PRODUCTION_CHIEF"], {
    message: "Por favor seleccione un rol válido.",
  }),
  isMaster: z.boolean().default(false),
});

type UserFormValues = z.infer<typeof userFormSchema>;

export function UserManagement() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Cast the user to the extended type
  const user = session?.user as ExtendedUser | undefined;

  // Initialize form
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "PRODUCTION_CHIEF",
      isMaster: false,
    },
  });

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Reset form when dialog opens/closes or editing user changes
  useEffect(() => {
    if (isDialogOpen) {
      if (editingUser) {
        form.reset({
          name: editingUser.name,
          email: editingUser.email,
          password: undefined,
          role: editingUser.role as "MASTER_ADMIN" | "MANAGER" | "PRODUCTION_CHIEF",
          isMaster: editingUser.isMaster,
        });
      } else {
        form.reset({
          name: "",
          email: "",
          password: "",
          role: "PRODUCTION_CHIEF",
          isMaster: false,
        });
      }
    }
  }, [isDialogOpen, editingUser, form]);

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (!response.ok) {
        throw new Error("Error al obtener usuarios");
      }
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Error al cargar usuarios");
    }
  };

  // Handle form submission
  const onSubmit = async (data: UserFormValues) => {
    setIsLoading(true);
    
    try {
      const url = editingUser 
        ? `/api/users/${editingUser.id}` 
        : "/api/users";
      
      const method = editingUser ? "PATCH" : "POST";
      
      // Remove password if it's empty and we're editing
      const payload = { ...data };
      if (editingUser && !payload.password) {
        delete payload.password;
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Error al guardar usuario");
      }

      toast.success(
        editingUser 
          ? "Usuario actualizado correctamente" 
          : "Usuario creado correctamente"
      );
      
      // Refresh users list
      fetchUsers();
      
      // Close dialog
      setIsDialogOpen(false);
      setEditingUser(null);
    } catch (error) {
      console.error("Error saving user:", error);
      toast.error("Error al guardar usuario");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle user deletion
  const deleteUser = async (userId: string) => {
    if (confirm("¿Está seguro de que desea eliminar este usuario?")) {
      setIsDeleting(true);
      
      try {
        const response = await fetch(`/api/users/${userId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Error al eliminar usuario");
        }

        toast.success("Usuario eliminado correctamente");
        
        // Refresh users list
        fetchUsers();
      } catch (error) {
        console.error("Error deleting user:", error);
        toast.error("Error al eliminar usuario");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Get role display name
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "MASTER_ADMIN":
        return "Administrador Master";
      case "MANAGER":
        return "Gerente";
      case "PRODUCTION_CHIEF":
        return "Jefe de Producción";
      default:
        return role;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Usuarios del Sistema</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingUser(null)}>
              Agregar Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? "Editar Usuario" : "Crear Nuevo Usuario"}
              </DialogTitle>
              <DialogDescription>
                {editingUser 
                  ? "Actualice los detalles del usuario a continuación." 
                  : "Complete los detalles para crear un nuevo usuario."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre del usuario" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo electrónico</FormLabel>
                      <FormControl>
                        <Input placeholder="correo@ejemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {editingUser ? "Nueva contraseña (opcional)" : "Contraseña"}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          {...field} 
                        />
                      </FormControl>
                      {editingUser && (
                        <FormDescription>
                          Deje en blanco para mantener la contraseña actual.
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rol</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar rol" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MASTER_ADMIN">Administrador Master</SelectItem>
                          <SelectItem value="MANAGER">Gerente</SelectItem>
                          <SelectItem value="PRODUCTION_CHIEF">Jefe de Producción</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isMaster"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Usuario Master</FormLabel>
                        <FormDescription>
                          Los usuarios master tienen acceso completo al sistema.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Guardando..." : "Guardar"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Master</TableHead>
              <TableHead>Creado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  No hay usuarios para mostrar
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getRoleDisplayName(user.role)}</TableCell>
                  <TableCell>{user.isMaster ? "Sí" : "No"}</TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingUser(user);
                          setIsDialogOpen(true);
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteUser(user.id)}
                        disabled={user.id === session?.user.id}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 