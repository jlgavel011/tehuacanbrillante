"use client";

import React, { useEffect } from 'react';
import { X, Check, CheckCheck, Bell, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { useNotifications, Notification } from '@/lib/context/NotificationContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

export function NotificationPanel() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll, isOpen, setIsOpen } = useNotifications();
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications/check');
      if (!response.ok) {
        throw new Error('Error al cargar notificaciones');
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      markAllAsRead();
      
      const response = await fetch('/api/notifications/check', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });
      
      if (!response.ok) {
        throw new Error('Error al marcar notificaciones como leídas');
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      markAsRead(notification.id);
      
      const response = await fetch('/api/notifications/check', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationId: notification.id
        })
      });
      
      if (!response.ok) {
        throw new Error('Error al marcar notificación como leída');
      }
      
      if (notification.link) {
        router.push(notification.link);
      }
      
      setIsOpen(false);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const getUniqueNotificationArray = (notifications: Notification[]) => {
    // Create a map to deduplicate notifications by ID
    const uniqueMap: Record<string, Notification> = {};
    notifications.forEach(notif => {
      uniqueMap[notif.id] = notif;
    });
    return Object.values(uniqueMap);
  };

  if (!isOpen) return null;

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  // Get unique arrays of notifications for each tab
  const uniqueNotifications = getUniqueNotificationArray(notifications);
  const unreadNotifications = getUniqueNotificationArray(notifications.filter(n => !n.read));
  const readNotifications = getUniqueNotificationArray(notifications.filter(n => n.read));

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex justify-end">
      <div 
        className="w-full max-w-md bg-white shadow-lg flex flex-col h-full"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-lg">Notificaciones</h2>
            {unreadCount > 0 && (
              <span className="bg-primary text-white text-xs rounded-full px-2 py-0.5">
                {unreadCount} nueva{unreadCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs flex items-center gap-1" 
                onClick={handleMarkAllAsRead}
              >
                <CheckCheck className="h-4 w-4" />
                <span>Marcar todas como leídas</span>
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full" 
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all" className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-3 mx-4 mt-2">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="unread">No leídas {unreadCount > 0 && `(${unreadCount})`}</TabsTrigger>
            <TabsTrigger value="read">Leídas</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 max-h-[calc(100vh-170px)]">
              {uniqueNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-gray-500">
                  <Bell className="h-12 w-12 mb-3 text-gray-300" />
                  <p className="text-center">No hay notificaciones</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {uniqueNotifications.map((notification, index) => (
                    <NotificationItem 
                      key={`all-${notification.id}-${index}`} 
                      notification={notification} 
                      onClick={handleNotificationClick}
                      getIcon={getIcon}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-gray-500 text-xs"
                  onClick={clearAll}
                >
                  Limpiar todas las notificaciones
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="unread" className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 max-h-[calc(100vh-170px)]">
              {unreadNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-gray-500">
                  <Check className="h-12 w-12 mb-3 text-gray-300" />
                  <p className="text-center">No hay notificaciones sin leer</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {unreadNotifications.map((notification, index) => (
                    <NotificationItem 
                      key={`unread-${notification.id}-${index}`} 
                      notification={notification} 
                      onClick={handleNotificationClick}
                      getIcon={getIcon}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
            {unreadNotifications.length > 0 && (
              <div className="p-3 border-t border-gray-200">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-gray-500 text-xs"
                  onClick={handleMarkAllAsRead}
                >
                  Marcar todas como leídas
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="read" className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 max-h-[calc(100vh-170px)]">
              {readNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-gray-500">
                  <Bell className="h-12 w-12 mb-3 text-gray-300" />
                  <p className="text-center">No hay notificaciones leídas</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {readNotifications.map((notification, index) => (
                    <NotificationItem 
                      key={`read-${notification.id}-${index}`} 
                      notification={notification} 
                      onClick={handleNotificationClick}
                      getIcon={getIcon}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
            {readNotifications.length > 0 && (
              <div className="p-3 border-t border-gray-200">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-gray-500 text-xs"
                  onClick={clearAll}
                >
                  Limpiar notificaciones leídas
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      <div 
        className="absolute inset-0 -z-10" 
        onClick={() => setIsOpen(false)}
      />
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onClick: (notification: Notification) => void;
  getIcon: (type: Notification['type']) => React.ReactNode;
}

function NotificationItem({ notification, onClick, getIcon }: NotificationItemProps) {
  const timeAgo = formatDistanceToNow(notification.timestamp, { addSuffix: true, locale: es });
  
  return (
    <div 
      onClick={() => onClick(notification)}
      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${notification.read ? 'bg-white' : 'bg-blue-50/30'}`}
    >
      <div className="flex">
        <div className="flex-shrink-0 mr-3">
          {getIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${notification.read ? 'text-gray-900' : 'text-black'}`}>
            {notification.title}
          </p>
          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
          <p className="text-xs text-gray-500 mt-1">{timeAgo}</p>
        </div>
        {!notification.read && (
          <div className="flex-shrink-0 ml-2">
            <div className="w-2 h-2 rounded-full bg-primary"></div>
          </div>
        )}
      </div>
    </div>
  );
} 