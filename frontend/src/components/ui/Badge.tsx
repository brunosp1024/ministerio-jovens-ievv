import React from "react";

interface BadgeProps {
  color: string;
  children: React.ReactNode;
}

export default function Badge({ color, children }: BadgeProps) {
  return (
    <span
      style={{
        background: color,
        color: "#fff",
        borderRadius: 12,
        padding: "0 6px",
        fontSize: 9.5,
        fontWeight: 600,
        display: "inline-block",
        opacity: 0.7,
      }}
    >
      {children}
    </span>
  );
}
