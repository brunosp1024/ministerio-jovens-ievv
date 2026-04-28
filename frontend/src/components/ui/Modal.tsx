"use client";
import { X } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export default function Modal({ open, onClose, title, children, size = "md" }: ModalProps) {
  const [shouldRender, setShouldRender] = useState(open);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let timeoutId: number | undefined;

    if (open) {
      setShouldRender(true);
      setIsVisible(false);
      document.body.style.overflow = "hidden";
    } else {
      setIsVisible(false);
      document.body.style.overflow = "";
      timeoutId = window.setTimeout(() => setShouldRender(false), 220);
    }

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open || !shouldRender) {
      return;
    }

    const animationFrame = window.requestAnimationFrame(() => setIsVisible(true));
    return () => window.cancelAnimationFrame(animationFrame);
  }, [open, shouldRender]);

  if (!shouldRender) return null;

  const sizes = { sm: "modal--sm", md: "modal--md", lg: "modal--lg", xl: "modal--xl" };

  return (
    <div className="modal-container" style={{marginTop: 0}}>
      <div
        className={cn(
          "modal-backdrop",
          isVisible ? "modal-backdrop--visible" : "modal-backdrop--hidden"
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          "modal-content",
          sizes[size],
          isVisible ? "modal-content--visible" : "modal-content--hidden"
        )}
      >
        <div className="modal__header">
          <h2 className="modal__title" style={{ width: '100%', textAlign: 'center' }}>{title}</h2>
          <button onClick={onClose} className="modal__close-btn">
            <X className="modal__close-icon" />
          </button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}
