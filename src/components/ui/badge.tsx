import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Ajouts personnalisés pour les états
        disponible: "border-transparent bg-green-500 text-white hover:bg-green-600",
        maintenance: "border-transparent bg-amber-500 text-white hover:bg-amber-600",
        horsService: "border-transparent bg-red-500 text-white hover:bg-red-600",
        aVerifier: "border-transparent bg-yellow-500 text-black hover:bg-yellow-600",
        indisponible: "border-transparent bg-gray-500 text-white hover:bg-gray-600",
        low: "border-transparent bg-orange-500 text-white hover:bg-orange-600",
        critical: "border-transparent bg-rose-500 text-white hover:bg-rose-600",
      },
      size: {
        default: "h-6 px-2.5 py-0.5 text-xs",
        sm: "h-5 px-2 py-0 text-xs",
        lg: "h-7 px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };