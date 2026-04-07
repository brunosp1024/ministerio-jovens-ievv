import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className, ...props }, ref) => (
  <div className="form-group">
    {label && <label className="form-label">{label}</label>}
    <input
      ref={ref}
      className={cn(
        "form-input",
        error ? "form-input--error" : "form-input--default",
        className
      )}
      {...props}
    />
    {error && <p className="form-error">{error}</p>}
  </div>
));
Input.displayName = "Input";
export default Input;
