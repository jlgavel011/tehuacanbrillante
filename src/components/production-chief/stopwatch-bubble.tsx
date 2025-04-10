import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, Pause, RefreshCw, X, Clock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function StopwatchBubble() {
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Iniciar o pausar el cronómetro
  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };
  
  // Reiniciar el cronómetro
  const resetTimer = () => {
    setIsRunning(false);
    setTime(0);
  };
  
  // Formatear el tiempo (mm:ss:ms)
  const formatTime = () => {
    const minutes = Math.floor(time / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    const milliseconds = Math.floor((time % 1000) / 10);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(2, '0')}`;
  };
  
  // Efecto para manejar el cronómetro
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTime(prevTime => prevTime + 10);
      }, 10);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning]);
  
  return (
    <>
      {/* Botón flotante para mostrar el cronómetro */}
      {!isVisible && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="default" 
                size="icon"
                className="fixed bottom-6 right-6 rounded-full w-12 h-12 bg-blue-400 hover:bg-blue-500 shadow-lg z-50 flex items-center justify-center"
                onClick={() => setIsVisible(true)}
              >
                <Clock className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Abrir cronómetro</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      {/* Panel del cronómetro */}
      {isVisible && (
        <Card className='fixed bottom-20 right-6 w-64 p-4 shadow-lg border border-blue-100 bg-white z-50'>
          <div className='flex justify-between items-center mb-2'>
            <h3 className='font-medium text-blue-500'>Cronómetro</h3>
            <Button 
              variant='ghost' 
              size='sm' 
              className='h-6 w-6 p-0'
              onClick={() => setIsVisible(false)}
            >
              <X className='h-4 w-4' />
            </Button>
          </div>
          
          <div className='text-center mb-3'>
            <div className='text-2xl font-mono font-bold'>{formatTime()}</div>
          </div>
          
          <div className='flex justify-center gap-2'>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={isRunning ? 'outline' : 'default'}
                    size='sm'
                    className={isRunning ? 'border-amber-200 text-amber-700' : 'bg-blue-400 hover:bg-blue-500'}
                    onClick={toggleTimer}
                  >
                    {isRunning ? <Pause className='h-4 w-4 mr-1' /> : <Play className='h-4 w-4 mr-1' />}
                    {isRunning ? 'Pausar' : 'Iniciar'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isRunning ? 'Pausar cronómetro' : 'Iniciar cronómetro'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant='outline'
                    size='sm'
                    onClick={resetTimer}
                    className='border-gray-200'
                  >
                    <RefreshCw className='h-4 w-4 mr-1' />
                    Reiniciar
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reiniciar cronómetro</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </Card>
      )}
    </>
  );
} 