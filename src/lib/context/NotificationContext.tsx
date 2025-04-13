"use client";

import React, { createContext, useState, useContext, useEffect } from 'react';
import { useSession } from "next-auth/react";

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'> & {id?: string, timestamp?: Date}) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session } = useSession();
  const [notificationsMap, setNotificationsMap] = useState<Record<string, Notification>>({});
  const [isOpen, setIsOpen] = useState(false);
  
  // Derived notifications array from the map
  const notifications = Object.values(notificationsMap).sort((a, b) => 
    b.timestamp.getTime() - a.timestamp.getTime()
  );
  
  // Función para cargar notificaciones desde localStorage como fallback
  useEffect(() => {
    if (session?.user?.email) {
      const storedNotifications = localStorage.getItem(`notifications_${session.user.email}`);
      if (storedNotifications) {
        try {
          const parsedNotifications = JSON.parse(storedNotifications);
          // Convert string timestamps back to Date objects and create a map
          const processedMap: Record<string, Notification> = {};
          parsedNotifications.forEach((notif: any) => {
            processedMap[notif.id] = {
              ...notif,
              timestamp: new Date(notif.timestamp)
            };
          });
          setNotificationsMap(processedMap);
        } catch (error) {
          console.error('Error parsing stored notifications:', error);
        }
      }
    }
  }, [session?.user?.email]);

  // Persistir notificaciones en localStorage cuando cambian
  useEffect(() => {
    if (session?.user?.email && notifications.length > 0) {
      localStorage.setItem(`notifications_${session.user.email}`, JSON.stringify(notifications));
    }
  }, [notifications, session?.user?.email]);

  // Verificar si hay notificaciones no leídas en el servidor
  useEffect(() => {
    // Solo verificar si hay una sesión activa
    if (session?.user?.id) {
      // Verificar al inicio
      checkServerNotifications();
      
      // Luego verificar cada 30 segundos
      const interval = setInterval(checkServerNotifications, 30000);
      
      return () => clearInterval(interval);
    }
  }, [session]);
  
  // Función para verificar notificaciones en el servidor
  const checkServerNotifications = async () => {
    // Esta función no hace nada por sí misma
    // El OrderNotificationListener intercepta la respuesta y actualiza el estado
    try {
      await fetch('/api/notifications/check');
    } catch (error) {
      console.error('Error checking notifications:', error);
    }
  };

  const unreadCount = notifications.filter(notif => !notif.read).length;

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'> & {id?: string, timestamp?: Date}) => {
    const newNotification: Notification = {
      ...notification,
      id: notification.id || Date.now().toString(),
      timestamp: notification.timestamp || new Date(),
      read: false
    };
    
    setNotificationsMap(prev => {
      // Check for similar notifications (same title and message that are unread)
      const similarExistingNotif = Object.values(prev).find(notif => 
        notif.title === newNotification.title && 
        notif.message === newNotification.message &&
        !notif.read
      );
      
      // If similar notification exists that's unread, don't add it
      if (similarExistingNotif && similarExistingNotif.id !== newNotification.id) {
        return prev;
      }
      
      // Add or update the notification in the map
      return {
        ...prev,
        [newNotification.id]: newNotification
      };
    });
  };

  const markAsRead = (id: string) => {
    setNotificationsMap(prev => {
      if (!prev[id]) return prev;
      
      return {
        ...prev,
        [id]: { ...prev[id], read: true }
      };
    });
  };

  const markAllAsRead = () => {
    setNotificationsMap(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(id => {
        updated[id] = { ...updated[id], read: true };
      });
      return updated;
    });
  };

  const clearAll = () => {
    setNotificationsMap({});
    if (session?.user?.email) {
      localStorage.removeItem(`notifications_${session.user.email}`);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearAll,
        isOpen,
        setIsOpen
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}; 