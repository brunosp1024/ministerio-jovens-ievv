import { TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ label, error, className, ...props }, ref) => (
  <div className="form-group">
    {label && <label className="form-label">{label}</label>}
    <textarea
      ref={ref}
      rows={3}
      className={cn(
        "form-textarea",
        error ? "form-textarea--error" : "form-textarea--default",
        className
      )}
      {...props}
    />
    {error && <p className="form-error">{error}</p>}
  </div>
));
Textarea.displayName = "Textarea";
export default Textarea;
