import { SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({ label, error, className, children, ...props }, ref) => (
  <div className="form-group">
    {label && <label className="form-label">{label}</label>}
    <select
      ref={ref}
      className={cn(
        "form-select",
        error ? "form-select--error" : "form-select--default",
        className
      )}
      {...props}
    >
      {children}
    </select>
    {error && <p className="form-error">{error}</p>}
  </div>
));
Select.displayName = "Select";
export default Select;
