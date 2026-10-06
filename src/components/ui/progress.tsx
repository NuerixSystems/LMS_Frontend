import React from "react";
import { cn } from "../../lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "success" | "accent";
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  showLabel = false,
  size = "md",
  variant = "primary",
  className,
  ...props
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  const sizeHeights = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  const variantFills = {
    primary: "bg-indigo-600",
    success: "bg-emerald-500",
    accent: "bg-violet-600",
  };

  return (
    <div className="w-full space-y-1">
      {showLabel && (
        <div className="flex justify-between items-center text-xs text-slate-600 font-medium">
          <span>Progress</span>
          <span>{clampedValue}%</span>
        </div>
      )}
      <div
        className={cn("w-full overflow-hidden rounded-full bg-slate-100", sizeHeights[size], className)}
        {...props}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300 ease-in-out",
            clampedValue === 100 ? "bg-emerald-500" : variantFills[variant]
          )}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
};
