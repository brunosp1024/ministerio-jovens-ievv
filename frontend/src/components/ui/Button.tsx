"use client";
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, children, disabled, ...props }, ref) => {
    const variants = {
      primary: "btn--primary",
      secondary: "btn--secondary",
      danger: "btn--danger",
      ghost: "btn--ghost",
      outline: "btn--outline",
    };
    const sizes = { sm: "btn--sm", md: "btn--md", lg: "btn--lg" };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn("btn", variants[variant], sizes[size], className)}
        {...props}
      >
        {loading && <Loader2 className="btn__spinner" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
export default Button;
