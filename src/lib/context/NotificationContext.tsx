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
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  
  // Load notifications from localStorage when component mounts and session is available
  useEffect(() => {
    if (session?.user?.email) {
      const storedNotifications = localStorage.getItem(`notifications_${session.user.email}`);
      if (storedNotifications) {
        try {
          const parsedNotifications = JSON.parse(storedNotifications);
          // Convert string timestamps back to Date objects
          const processedNotifications = parsedNotifications.map((notif: any) => ({
            ...notif,
            timestamp: new Date(notif.timestamp)
          }));
          setNotifications(processedNotifications);
        } catch (error) {
          console.error('Error parsing stored notifications:', error);
        }
      }
    }
  }, [session?.user?.email]);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (session?.user?.email && notifications.length > 0) {
      localStorage.setItem(`notifications_${session.user.email}`, JSON.stringify(notifications));
    }
  }, [notifications, session?.user?.email]);

  const unreadCount = notifications.filter(notif => !notif.read).length;

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(), // Simple ID generation
      timestamp: new Date(),
      read: false
    };
    
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const clearAll = () => {
    setNotifications([]);
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