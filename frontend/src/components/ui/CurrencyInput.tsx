import { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { formatCurrencyInputValue, normalizeCurrencyInput } from "@/lib/currency";

interface CurrencyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "inputMode" | "value" | "defaultValue" | "onChange"> {
  label?: string;
  error?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  wrapperClassName?: string;
}

const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ label, error, className, wrapperClassName, value, onValueChange, ...props }, ref) => (
    <div className={cn(label ? "form-group" : undefined, wrapperClassName)}>
      {label && <label className="form-label">{label}</label>}
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        value={formatCurrencyInputValue(value)}
        onChange={(event) => onValueChange?.(normalizeCurrencyInput(event.target.value))}
        className={cn(
          "form-input",
          error ? "form-input--error" : "form-input--default",
          className,
        )}
        {...props}
      />
      {error && <p className="form-error">{error}</p>}
    </div>
  ),
);

CurrencyInput.displayName = "CurrencyInput";

export default CurrencyInput;