import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const selectVariants = cva(
  "flex h-11 w-full rounded-2xl border border-border bg-background/80 px-4 py-2 text-sm text-foreground shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 hover:border-border/80",
  {
    variants: {
      variant: {
        default: "",
        underline: "border-b border-b-0 rounded-none bg-transparent px-0 py-1 hover:border-b-b",
        field: "border-none bg-background/50 rounded-xl px-3 py-1.5",
        soft: "border border-border/50 bg-background/90 backdrop-blur-sm rounded-xl",
      },
      size: {
        xs: "h-9 px-3 text-xs",
        sm: "h-10 px-3.5 text-sm",
        default: "h-11 px-4 py-2 text-sm",
        lg: "h-12 px-5 text-base",
        xl: "h-14 px-6 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & VariantProps<typeof selectVariants>;

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <select
        className={cn(selectVariants({ variant, size, className }), className)}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    );
  },
);

Select.displayName = "Select";

export { Select };
