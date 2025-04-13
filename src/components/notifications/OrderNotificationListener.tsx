"use client";

import { useEffect } from 'react';
import { useNotifications } from '@/lib/context/NotificationContext';
import { useSession } from 'next-auth/react';
import React from 'react';

// Interfaces para tipos
interface NotificationData {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
  targetRoles?: string[];
  sourceUserId?: string;
}

interface ApiNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  read: boolean;
  timestamp: Date;
}

// Este componente escucha interacciones con la API y genera notificaciones
export default function OrderNotificationListener() {
  const { addNotification } = useNotifications();
  const { data: session } = useSession();
  
  // Verificar si el usuario es administrador (MASTER_ADMIN o MANAGER)
  const isAdmin = session?.user?.role === "MASTER_ADMIN" || session?.user?.role === "MANAGER";
  // Verificar si el usuario es jefe de producción
  const isProductionChief = session?.user?.role === "PRODUCTION_CHIEF";
  
  // Store the notification IDs in a ref to persist across renders
  // This helps prevent duplicate notifications from being added
  const processedNotifications = React.useRef(new Set<string>());
  
  // Clear processed notifications when user session changes
  React.useEffect(() => {
    if (session?.user?.id) {
      // Reset the processed notifications when session changes
      processedNotifications.current = new Set<string>();
    }
  }, [session?.user?.id]);

  useEffect(() => {
    // Solo activar el interceptor si el usuario está autenticado
    if (!session?.user?.id) return;
    
    console.log("Initializing OrderNotificationListener for user:", {
      id: session.user.id,
      role: session.user.role,
      isAdmin,
      isProductionChief
    });
    
    // Interceptamos fetch para capturar las interacciones con la API
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const [url, options] = args;
      
      // Obtener la URL como string
      const urlStr = url.toString();
      
      // Realizar la llamada original
      const response = await originalFetch(...args);
      
      // Solo procedemos si la respuesta fue exitosa y estamos procesando peticiones relevantes
      if (!response.ok) return response;
      
      try {
        // Si es jefe de producción que envía operaciones a órdenes de producción
        if (isProductionChief && typeof urlStr === 'string') {
          // Intentamos interceptar las operaciones importantes para crear notificaciones
          if (urlStr.includes('/api/production-orders/') && options?.method === 'POST') {
            
            // Clonamos la respuesta para no consumirla
            const responseClone = response.clone();
            let data;
            
            try {
              data = await responseClone.json();
            } catch (err) {
              console.error("Error parsing response JSON:", err);
              return response;
            }
            
            console.log("[OrderNotificationListener] Production Chief API call:", {
              url: urlStr,
              method: options?.method,
              responseStatus: response.status,
              dataKeys: Object.keys(data)
            });
            
            // APERTURA DE ORDEN: Cuando se inicia una orden por primera vez
            if (urlStr.includes('/start')) {
              console.log("[OrderNotificationListener] Production order started:", data);
              
              // Verificar que tenemos los datos necesarios
              if (data && data.id && data.numeroOrden) {
                await sendNotificationToApi({
                  title: '🚀 Orden Iniciada',
                  message: `La orden #${data.numeroOrden} de ${data.producto?.nombre || 'Producto'} ha comenzado la producción.`,
                  type: 'info',
                  link: `/production-orders?id=${data.id}`,
                  targetRoles: ['MASTER_ADMIN', 'MANAGER']
                });
              }
            }
            
            // REAPERTURA DE ORDEN: Cuando se reabre una orden que estaba en pausa
            else if (urlStr.includes('/reopen')) {
              console.log("[OrderNotificationListener] Production order reopened:", data);
              
              // La respuesta puede tener la orden en 'order' o directamente
              const orderData = data.order || data;
              
              if (orderData && orderData.id) {
                // Obtener el número de orden del objeto
                const orderNumber = orderData.numeroOrden || 
                  (typeof orderData.id === 'string' ? orderData.id.substring(0, 8) : 'desconocida');
                
                // Nombre del producto puede estar anidado o no disponible
                const productName = orderData.producto?.nombre || 'Producto';
                
                await sendNotificationToApi({
                  title: '🔄 Orden Reabierta',
                  message: `La orden #${orderNumber} de ${productName} ha sido reabierta.`,
                  type: 'warning',
                  link: `/production-orders?id=${orderData.id}`,
                  targetRoles: ['MASTER_ADMIN', 'MANAGER']
                });
              }
            }
            
            // FINALIZACIÓN DE ORDEN: Cuando se completa una orden
            else if (urlStr.includes('/finish')) {
              console.log("[OrderNotificationListener] Production order finished:", data);
              
              // La respuesta puede tener la orden en 'order' o directamente
              const orderData = data.order || data;
              
              if (orderData && orderData.id) {
                const orderNumber = orderData.numeroOrden || 
                  (typeof orderData.id === 'string' ? orderData.id.substring(0, 8) : 'desconocida');
                const productName = orderData.producto?.nombre || 'Producto';
                const cajasProducidas = orderData.cajasProducidas || 0;
                
                await sendNotificationToApi({
                  title: '✅ Orden Completada',
                  message: `La orden #${orderNumber} de ${productName} se ha completado. Cajas producidas: ${cajasProducidas}.`,
                  type: 'success',
                  link: `/production-orders?id=${orderData.id}`,
                  targetRoles: ['MASTER_ADMIN', 'MANAGER']
                });
              }
            }
          }
        }
        
        // Si es administrador procesando notificaciones
        else if (isAdmin && typeof urlStr === 'string' && urlStr.includes('/api/notifications/check')) {
          // Clonamos la respuesta para no consumirla
          const responseClone = response.clone();
          let data;
          
          try {
            data = await responseClone.json();
          } catch (err) {
            console.error("Error parsing response JSON:", err);
            return response;
          }
          
          console.log("[OrderNotificationListener] Admin notifications response:", {
            url: urlStr,
            notificationsCount: data.notifications?.length || 0
          });
          
          // Verificamos si hay notificaciones para el admin actual
          if (data.notifications && Array.isArray(data.notifications) && data.notifications.length > 0) {
            // Process all notifications in batch to prevent rendering issues
            const newNotifications: ApiNotification[] = [];
            
            data.notifications.forEach((notification: ApiNotification) => {
              // Skip if we've already processed this notification
              if (processedNotifications.current.has(notification.id)) {
                return;
              }
              
              // Add to our list of processed notifications
              processedNotifications.current.add(notification.id);
              newNotifications.push(notification);
            });
            
            // Log and add all new notifications
            if (newNotifications.length > 0) {
              console.log(`[OrderNotificationListener] Adding ${newNotifications.length} new notifications to UI`);
              
              // Process each notification
              newNotifications.forEach(notification => {
                console.log("[OrderNotificationListener] Adding notification:", notification);
                addNotification({
                  id: notification.id,
                  title: notification.title,
                  message: notification.message,
                  type: notification.type as 'info' | 'success' | 'warning' | 'error',
                  link: notification.link,
                  timestamp: new Date(notification.timestamp)
                });
              });
            }
          }
        }
      } catch (error) {
        console.error("[OrderNotificationListener] Error processing request:", error);
      }
      
      // Devolver la respuesta original para que el flujo normal continue
      return response;
    };
    
    // Función para enviar notificaciones a través de la API
    const sendNotificationToApi = async (notification: NotificationData) => {
      try {
        console.log("[OrderNotificationListener] Sending notification to API:", notification);
        
        const response = await fetch('/api/notifications/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...notification,
            sourceUserId: session.user.id
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(`Failed to send notification: ${errorData?.error || response.statusText}`);
        }
        
        const responseData = await response.json();
        console.log("[OrderNotificationListener] Notification API response:", responseData);
      } catch (error) {
        console.error("[OrderNotificationListener] Error sending notification to API:", error);
      }
    };
    
    // Si es admin, consultar periódicamente por nuevas notificaciones
    let notificationCheckInterval: NodeJS.Timeout | null = null;
    if (isAdmin) {
      // Verificar notificaciones inmediatamente
      checkNotifications();
      
      // Luego verificar cada 30 segundos
      notificationCheckInterval = setInterval(checkNotifications, 30000);
    }
    
    // Función para verificar notificaciones
    async function checkNotifications() {
      try {
        console.log("[OrderNotificationListener] Checking for notifications");
        await fetch('/api/notifications/check', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        // El interceptor se encargará de procesar la respuesta
      } catch (error) {
        console.error("[OrderNotificationListener] Error checking notifications:", error);
      }
    }
    
    // Limpieza al desmontar el componente
    return () => {
      window.fetch = originalFetch;
      if (notificationCheckInterval) {
        clearInterval(notificationCheckInterval);
      }
    };
  }, [addNotification, session, isAdmin, isProductionChief]);

  // Este componente no renderiza nada
  return null;
} 