import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CardTitle, CardDescription } from "@/components/ui/card";

interface ReportCardProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  headerExtra?: ReactNode;
}

export function ReportCard({
  title,
  subtitle,
  icon: Icon,
  children,
  className = "",
  headerClassName = "bg-blue-50",
  headerExtra,
}: ReportCardProps) {
  return (
    <Card className={cn("overflow-hidden bg-white", className)}>
      <div className={cn("p-6", headerClassName)}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {subtitle && (
              <CardDescription className="mt-1">{subtitle}</CardDescription>
            )}
          </div>
          {headerExtra && <div>{headerExtra}</div>}
        </div>
      </div>
      {children}
    </Card>
  );
} 