import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function formatDateTime(date: Date | string) {
  return new Date(date).toLocaleString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
  })
}

export function generateOrderNumber(): number {
  // Generate a random 5-digit number
  return Math.floor(10000 + Math.random() * 90000)
}
