import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "border-border placeholder:text-text-disabled flex h-10 w-full rounded-md border bg-white px-3 py-2 text-body shadow-sm transition-all",
        "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface",
        "aria-invalid:border-error aria-invalid:ring-error/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
