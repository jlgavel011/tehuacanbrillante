"use client";

import { useEffect } from 'react';
import { useNotifications } from '@/lib/context/NotificationContext';

// Tipos para trabajar con las órdenes de producción
interface ProductionOrder {
  id: string;
  orderNumber: string;
  productName: string;
  status: 'pendiente' | 'en_proceso' | 'completada' | 'cancelada';
  // Otros campos según necesites
}

// Simular un listener que escucha cambios en las órdenes
// En una aplicación real, esto podría ser una suscripción a una API de tiempo real o un polling
export function useOrderStatusChangeListener() {
  const { addNotification } = useNotifications();

  // Esta función simula la recepción de un evento cuando una orden cambia de estado
  // En una aplicación real, esto podría ser un socket o una función de callback de una API
  const handleOrderStatusChange = (order: ProductionOrder, previousStatus: string, newStatus: string) => {
    // Cuando una orden pasa de pendiente a en proceso
    if (previousStatus === 'pendiente' && newStatus === 'en_proceso') {
      addNotification({
        title: 'Orden iniciada',
        message: `La orden #${order.orderNumber} de ${order.productName} ha comenzado la producción.`,
        type: 'info',
        link: `/production-orders/${order.id}`
      });
    }
    
    // Cuando una orden pasa de en proceso a completada
    if (previousStatus === 'en_proceso' && newStatus === 'completada') {
      addNotification({
        title: 'Orden completada',
        message: `La orden #${order.orderNumber} de ${order.productName} se ha completado con éxito.`,
        type: 'success',
        link: `/production-orders/${order.id}`
      });
    }

    // También podrías añadir notificaciones para otros cambios de estado
    // Por ejemplo, si una orden es cancelada
    if (newStatus === 'cancelada') {
      addNotification({
        title: 'Orden cancelada',
        message: `La orden #${order.orderNumber} de ${order.productName} ha sido cancelada.`,
        type: 'warning',
        link: `/production-orders/${order.id}`
      });
    }
  };

  return {
    handleOrderStatusChange
  };
}

// Hook para usar en componentes que necesitan escuchar cambios de órdenes
export function useOrderNotifications() {
  const { handleOrderStatusChange } = useOrderStatusChangeListener();
  
  return {
    notifyOrderStatusChange: handleOrderStatusChange
  };
}

// En un contexto real, también deberías añadir este hook al componente que gestiona las órdenes
// Por ejemplo, en un componente OrderList o similar 