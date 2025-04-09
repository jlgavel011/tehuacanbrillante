"use client";

import { useEffect } from 'react';
import { useNotifications } from '@/lib/context/NotificationContext';

// Este componente no renderiza nada, solo escucha eventos y maneja notificaciones
export default function OrderNotificationListener() {
  const { addNotification } = useNotifications();

  useEffect(() => {
    // Esta es una forma simplificada. En un caso real, podrías escuchar un evento de un WebSocket
    // o hacer polling a una API para detectar cambios de estado.

    // Función para manejar la interceptación de llamadas a la API
    const fetchOriginal = window.fetch;
    
    // Sobreescribimos la función fetch para interceptar las respuestas de la API
    window.fetch = async (...args) => {
      const [url, options] = args;
      
      // Obtenemos la respuesta original
      const response = await fetchOriginal(...args);
      
      // Clonamos la respuesta para no consumirla
      const responseClone = response.clone();
      
      try {
        // Solo procesamos las respuestas de las API de órdenes de producción
        if (
          typeof url === 'string' && 
          (url.includes('/api/production-orders') && 
          (url.includes('/start') || url.includes('/finish')))
        ) {
          const data = await responseClone.json();
          
          // Si la respuesta es exitosa, verificamos el tipo de operación
          if (response.ok) {
            // Verificamos si es una orden iniciada
            if (url.includes('/start')) {
              const orderData = data;
              if (orderData && orderData.id) {
                addNotification({
                  title: 'Orden iniciada',
                  message: `La orden #${orderData.numeroOrden || orderData.id.substring(0, 8)} ha comenzado la producción.`,
                  type: 'info',
                  link: `/production-orders/${orderData.id}`
                });
              }
            }
            
            // Verificamos si es una orden finalizada
            if (url.includes('/finish')) {
              const orderData = data.order;
              if (orderData && orderData.id && data.message.includes('finalizada')) {
                addNotification({
                  title: 'Orden completada',
                  message: `La orden #${orderData.numeroOrden || orderData.id.substring(0, 8)} se ha completado con éxito.`,
                  type: 'success',
                  link: `/production-orders/${orderData.id}`
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('Error al procesar notificación de orden:', error);
      }
      
      return response;
    };
    
    // Limpieza al desmontar
    return () => {
      window.fetch = fetchOriginal;
    };
  }, [addNotification]);

  // Este componente no renderiza nada
  return null;
} 