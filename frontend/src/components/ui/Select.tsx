import { SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface Option {
  label: string;
  value: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: string;
  error?: string;
  options: Option[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({ label, error, className, options, ...props }, ref) => (
  <div className="form-group">
    {label && <label className="form-label">{label}</label>}
    <div className="relative w-full">
      <select
        ref={ref}
        className={cn(
          "form-select appearance-none w-full py-2 px-4 pr-10 rounded-lg border text-base text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:bg-slate-100 disabled:text-slate-400",
          error ? "border-red-500 bg-red-50 focus:ring-red-200" : "border-slate-300",
          className
        )}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {/* Ícone de seta */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
      >
        <path d="M6 8L10 12L14 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
    {error && <p className="form-error">{error}</p>}
  </div>
));
Select.displayName = "Select";
export default Select;
