"use client";

import { cn } from "@/lib/utils";

interface ToggleProps {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export default function Toggle({ label, checked, onChange, disabled = false }: ToggleProps) {
  return (
    <div className="form-group">
      {label && <span className="form-label">{label}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn("toggle", checked ? "toggle--on" : "toggle--off", disabled && "toggle--disabled")}
      >
        <span className={cn("toggle__knob", checked ? "toggle__knob--on" : "toggle__knob--off")} />
      </button>
    </div>
  );
}
