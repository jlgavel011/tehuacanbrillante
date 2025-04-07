import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export interface ViewDetailsButtonProps {
  onClick?: () => void;
  href?: string;
}

export function ViewDetailsButton({ onClick, href }: ViewDetailsButtonProps) {
  // Si tenemos href, usamos Link, sino usamos Button directamente
  if (href) {
    return (
      <Link href={href} passHref>
        <Button variant="outline" className="w-full">
          Ver detalles
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>
    );
  }

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