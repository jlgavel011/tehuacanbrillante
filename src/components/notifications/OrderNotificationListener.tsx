"use client";

import { useEffect } from 'react';
import { useNotifications } from '@/lib/context/NotificationContext';

// Este componente escucha interacciones con la API y genera notificaciones
export default function OrderNotificationListener() {
  const { addNotification } = useNotifications();

  useEffect(() => {
    // Interceptamos fetch para capturar las interacciones con la API
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const [url, options] = args;
      
      // Obtenemos la respuesta original
      const response = await originalFetch(...args);
      
      // Clonamos la respuesta para no consumirla
      const responseClone = response.clone();
      
      try {
        // Solo procesamos peticiones a la API de órdenes de producción
        if (typeof url === 'string' && url.includes('/api/production-orders')) {
          
          // Si la respuesta es exitosa, verificamos el tipo de operación
          if (response.ok) {
            const data = await responseClone.json();
            
            // APERTURA DE ORDEN: Cuando se inicia una orden por primera vez
            if (url.includes('/start') && options?.method === 'POST') {
              const orderData = data;
              
              if (orderData && orderData.id) {
                const orderNumber = orderData.numeroOrden || orderData.id.substring(0, 8);
                const productName = orderData.producto?.nombre || 'Producto';
                
                addNotification({
                  title: '🚀 Orden Iniciada',
                  message: `La orden #${orderNumber} de ${productName} ha comenzado la producción.`,
                  type: 'info',
                  link: `/production-orders/${orderData.id}`
                });
              }
            }
            
            // REAPERTURA DE ORDEN: Cuando se reabre una orden que estaba en pausa
            if (url.includes('/reopen') && options?.method === 'POST') {
              const orderData = data.order || data;
              
              if (orderData && orderData.id) {
                const orderNumber = orderData.numeroOrden || orderData.id.substring(0, 8);
                const productName = orderData.producto?.nombre || 'Producto';
                
                addNotification({
                  title: '🔄 Orden Reabierta',
                  message: `La orden #${orderNumber} de ${productName} ha sido reabierta y está nuevamente en producción.`,
                  type: 'warning',
                  link: `/production-orders/${orderData.id}`
                });
              }
            }
            
            // FINALIZACIÓN DE ORDEN: Cuando se completa una orden
            if (url.includes('/finish') && options?.method === 'POST') {
              const orderData = data.order || data;
              const message = data.message || '';
              
              if (orderData && orderData.id && message.includes('finalizada')) {
                const orderNumber = orderData.numeroOrden || orderData.id.substring(0, 8);
                const productName = orderData.producto?.nombre || 'Producto';
                const cajasProducidas = orderData.cajasProducidas || 0;
                
                addNotification({
                  title: '✅ Orden Completada',
                  message: `La orden #${orderNumber} de ${productName} se ha completado con éxito. Cajas producidas: ${cajasProducidas}.`,
                  type: 'success',
                  link: `/production-orders/${orderData.id}`
                });
              }
            }
            
            // CANCELACIÓN DE ORDEN: Cuando se cancela una orden
            if (url.includes('/cancel') && options?.method === 'POST') {
              const orderData = data.order || data;
              
              if (orderData && orderData.id) {
                const orderNumber = orderData.numeroOrden || orderData.id.substring(0, 8);
                const productName = orderData.producto?.nombre || 'Producto';
                
                addNotification({
                  title: '❌ Orden Cancelada',
                  message: `La orden #${orderNumber} de ${productName} ha sido cancelada.`,
                  type: 'error',
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
    
    // Limpieza al desmontar el componente
    return () => {
      window.fetch = originalFetch;
    };
  }, [addNotification]);

  // Este componente no renderiza nada
  return null;
} 