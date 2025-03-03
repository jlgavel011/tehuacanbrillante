import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-white hover:bg-primary-light",
        secondary:
          "border-transparent bg-secondary text-white hover:bg-secondary-light",
        destructive:
          "border-transparent bg-error text-white hover:bg-error-dark",
        outline: "border-border text-text-primary hover:border-primary hover:text-primary",
        success: "border-transparent bg-success text-white hover:bg-success-dark",
        warning: "border-transparent bg-warning text-text-primary hover:bg-warning-dark",
        info: "border-transparent bg-info text-white hover:bg-info-dark",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
