"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer border-border data-[state=checked]:bg-primary data-[state=checked]:text-white data-[state=checked]:border-primary focus-visible:border-primary focus-visible:ring-primary/20 aria-invalid:ring-error/20 aria-invalid:border-error size-5 shrink-0 rounded-md border shadow-sm transition-all outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current"
      >
        <CheckIcon className="h-4 w-4" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
