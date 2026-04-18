import React from "react";

interface BadgeProps {
  bgColor: string;
  textColor: string;
  fontSize?: number;
  children: React.ReactNode;
}

export default function Badge({ bgColor, textColor, fontSize = 9.5, children }: BadgeProps) {
  return (
    <span
      style={{
        background: bgColor,
        color: textColor,
        fontSize: fontSize,
        borderRadius: 12,
        padding: "0 6px",
        fontWeight: 600,
        display: "inline-block",
        opacity: 0.6,
        border: `1px solid #5b7fa7`,
      }}
    >
      {children}
    </span>
  );
}
