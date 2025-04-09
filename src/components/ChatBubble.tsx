"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSession } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';

export function ChatBubble() {
  const { data: session, status } = useSession();
  const [message, setMessage] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!message || !session) return;
    
    setIsSubmitting(true);
    try {
      console.log('Enviando sugerencia:', {
        user: session?.user?.name || 'Anónimo',
        message,
        date: new Date().toISOString()
      });
      
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL 
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/suggestions` 
        : '/api/suggestions';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: session?.user?.name || 'Anónimo',
          message,
          date: new Date().toISOString(),
        }),
      });
      
      // Log the response status
      console.log('Estado de respuesta:', response.status);
      
      // Try to parse the response JSON
      let responseData;
      try {
        responseData = await response.json();
        console.log('Datos de respuesta:', responseData);
      } catch (parseError) {
        console.error('Error al parsear respuesta JSON:', parseError);
      }
      
      if (response.ok) {
        setMessage('');
        setIsVisible(false);
        toast({
          title: "Sugerencia enviada",
          description: "¡Gracias por ayudarnos a mejorar!",
          variant: "default",
        });
      } else {
        toast({
          title: "Error",
          description: `No se pudo enviar tu sugerencia. ${responseData?.error || 'Intenta de nuevo más tarde.'}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error al enviar la sugerencia:', error);
      toast({
        title: "Error",
        description: `Ocurrió un error al enviar tu sugerencia: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle loading or unauthenticated states
  if (status === 'loading' || !session) return null;

  // Check if the user has Manager or Master access
  const hasAccess = session?.user?.role === 'MANAGER' || session?.user?.role === 'MASTER_ADMIN';

  if (!hasAccess) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button 
        onClick={() => setIsVisible(!isVisible)} 
        className="rounded-full h-12 w-12 p-0 shadow-lg bg-blue-600 hover:bg-blue-700"
        aria-label={isVisible ? 'Cerrar sugerencias' : 'Abrir sugerencias'}
      >
        {isVisible ? 'X' : '💡'}
      </Button>
      
      {isVisible && (
        <div className="absolute bottom-16 right-0 p-4 bg-white rounded-lg shadow-lg w-80 border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-2">Enviar Sugerencia</h3>
          <p className="text-sm text-gray-500 mb-3 dark:text-gray-400">
            Comparte tus ideas para mejorar la aplicación o reporta problemas que hayas encontrado.
          </p>
          
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribe tu sugerencia o reporte de error..."
            className="mb-3 min-h-[100px]"
          />
          
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsVisible(false);
                setMessage('');
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!message || isSubmitting}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 