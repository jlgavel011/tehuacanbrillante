import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 text-body grid has-[>svg]:grid-cols-[24px_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-1 items-start [&>svg]:h-5 [&>svg]:w-5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-surface border-border text-text-primary",
        primary: "bg-primary/10 border-primary/20 text-primary-dark",
        success: "bg-success-light border-success text-success-dark",
        warning: "bg-warning-light border-warning text-warning-dark",
        destructive: "bg-error-light border-error text-error-dark",
        info: "bg-info-light border-info text-info-dark",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 font-semibold text-h4",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "col-start-2 text-body-small grid justify-items-start gap-1 [&_p]:leading-relaxed",
        className
      )}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription }
