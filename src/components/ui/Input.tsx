import { InputHTMLAttributes, forwardRef } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", error, disabled, ...props }, ref) => {
    return (
      <input
        ref={ref}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        className={`w-full h-[42px] rounded-[3px] border bg-white px-3.5 py-2 text-sm text-[#3d4146] placeholder:text-[#9aa4ab] transition-all focus:outline-none focus:ring-1 disabled:opacity-50 disabled:cursor-not-allowed ${
          error
            ? "border-red-400 focus:border-red-400 focus:ring-red-400"
            : "border-zinc-300 focus:border-[#1c8fca] focus:ring-[#1c8fca]"
        } ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
