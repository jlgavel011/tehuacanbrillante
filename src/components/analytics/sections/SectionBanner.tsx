import { cn } from "@/lib/utils";

interface Indicator {
  label: string;
  value: number;
}

interface SectionBannerProps {
  title: string;
  indicators?: Indicator[];
  className?: string;
}

export function SectionBanner({ title, indicators, className }: SectionBannerProps) {
  return (
    <div className={cn("bg-[#EBF6F9] w-full p-3 rounded-t-lg", className)}>
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      {indicators && indicators.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {indicators.map((indicator, index) => (
            <div key={index} className="flex flex-col">
              <span className="text-sm text-muted-foreground">{indicator.label}</span>
              <span className="text-xl font-bold">{indicator.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}