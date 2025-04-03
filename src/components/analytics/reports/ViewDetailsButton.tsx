import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

export interface ViewDetailsButtonProps {
  onClick?: () => void;
}

export function ViewDetailsButton({ onClick }: ViewDetailsButtonProps) {
  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={onClick}
    >
      Ver detalles
      <ChevronRight className="ml-2 h-4 w-4" />
    </Button>
  );
} 