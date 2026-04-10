import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const cardVariants = cva(
  "rounded-[28px] border border-border/80 bg-card/90 text-card-foreground shadow-[0_20px_60px_-32px_rgba(15,23,42,0.35)] backdrop-blur-sm transition-all duration-200 hover:translate-y-[-2px]",
  {
    variants: {
      variant: {
        default: "",
        elevated: "shadow-[0_10px_30px_-10px_rgba(15,23,42,0.25)]",
        bordered: "border border-border/60 bg-card/95",
        soft: "border-none bg-card/80 backdrop-blur",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export function Card({
  className,
  variant,
  ...props
}: HTMLAttributes<HTMLDivElement> & VariantProps<typeof cardVariants>) {
  return (
    <div
      className={cn(cardVariants({ variant, className }), className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-2 p-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-lg font-semibold tracking-tight text-foreground", className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 pb-6", className)} {...props} />;
}
