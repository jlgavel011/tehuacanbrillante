import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ViewDetailsButton } from "./ViewDetailsButton";

interface ReportCardProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
  onViewDetails?: () => void;
}

export function ReportCard({
  title,
  subtitle,
  icon: Icon,
  children,
  className,
  onViewDetails,
}: ReportCardProps) {
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        {subtitle && <CardDescription>{subtitle}</CardDescription>}
      </CardHeader>
      <CardContent className="p-3 pt-2">
        {children}
        {onViewDetails && <ViewDetailsButton onClick={onViewDetails} />}
      </CardContent>
    </Card>
  );
} 