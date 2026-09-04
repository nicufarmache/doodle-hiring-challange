import { ButtonHTMLAttributes, forwardRef } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      fullWidth = false,
      className = "",
      disabled,
      type = "button",
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-[3px] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1";

    const variants = {
      primary:
        "bg-[#ff7865] hover:bg-[#f36b58] active:bg-[#e75e4b] text-white shadow-2xs focus-visible:ring-[#ff7865]",
      secondary:
        "bg-[#1c8fca] hover:bg-[#1881b7] active:bg-[#1473a3] text-white shadow-2xs focus-visible:ring-[#1c8fca]",
      outline:
        "border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 focus-visible:ring-[#1c8fca]",
      ghost:
        "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 focus-visible:ring-zinc-400",
    };

    const sizes = {
      sm: "h-[34px] px-3 text-xs gap-1.5",
      md: "h-[42px] px-5 sm:px-6 text-sm gap-2",
      lg: "h-[44px] px-6 text-sm sm:text-base gap-2.5",
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${
          fullWidth ? "w-full" : ""
        } ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
