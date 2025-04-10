"use client";

import React from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = "Cargando..." }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50">
      <div className="flex flex-col items-center justify-center space-y-6 px-4 text-center">
        {/* Logo animation */}
        <div className="relative h-16 w-16 mb-2">
          <motion.div 
            className="absolute inset-0 flex items-center justify-center"
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.8, 1, 0.8] 
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut" 
            }}
          >
            <div className="h-12 w-12 rounded-full bg-primary opacity-20"></div>
          </motion.div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="w-2 h-8 bg-primary rounded-l-md mr-2"></span>
            <span className="font-bold text-lg text-primary">TB</span>
          </div>
        </div>
        
        {/* Spinner */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="h-10 w-10 text-primary" />
        </motion.div>
        
        {/* Message */}
        <div className="space-y-2">
          <p className="text-lg font-medium text-foreground">{message}</p>
          <p className="text-sm text-muted-foreground">Preparando la información de producción...</p>
        </div>
        
        {/* Progress bar */}
        <div className="w-56 bg-muted rounded-full h-2 overflow-hidden">
          <motion.div 
            className="h-full bg-primary rounded-full"
            animate={{ 
              width: ["0%", "100%"],
            }}
            transition={{ 
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
      </div>
    </div>
  );
} 