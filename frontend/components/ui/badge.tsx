import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          // Highest contrast (Solid Black / Solid White)
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80":
            variant === "default",
            
          // Medium contrast (Muted Gray)
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80":
            variant === "secondary",
            
          // Error/High Risk state (This uses the standard Shadcn red)
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80":
            variant === "destructive",
            
          // Lowest contrast (Transparent background with a border)
          "text-foreground border-border": 
            variant === "outline",
        },
        className,
      )}
      {...props}
    />
  );
}