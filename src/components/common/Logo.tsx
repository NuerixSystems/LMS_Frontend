// src/components/common/Logo.tsx
import React from "react";
import { Link } from "react-router-dom";

interface LogoProps {
  /** "full" = icon + text | "icon" = cube only */
  variant?: "full" | "icon";
  /** Size of the logo */
  size?: "sm" | "md" | "lg" | "xl";
  /** Light version for dark backgrounds */
  theme?: "default" | "light";
  /** Wrap in Link to home */
  linkTo?: string;
  /** Show link */
  clickable?: boolean;
  className?: string;
}

const SIZES = {
  sm: { icon: 28, text: "text-lg" },
  md: { icon: 36, text: "text-xl" },
  lg: { icon: 44, text: "text-2xl" },
  xl: { icon: 56, text: "text-3xl" },
};

export const Logo: React.FC<LogoProps> = ({
  variant = "full",
  size = "md",
  theme = "default",
  linkTo = "/",
  clickable = true,
  className = "",
}) => {
  const { icon: iconSize, text: textSize } = SIZES[size];
  const isLight = theme === "light";

  const content = (
    <div
      className={`inline-flex items-center gap-2 select-none ${className}`}
      aria-label="CourseBox"
    >
      {/* Cube Icon */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <path d="M50 10 L85 30 L50 50 L15 30 Z" fill="#5EEAD4" />
        <path d="M15 30 L50 50 L50 90 L15 70 Z" fill="#3730A3" />
        <path d="M85 30 L50 50 L50 90 L85 70 Z" fill="#4F46E5" />
        <path
          d="M25 42 L42 51 M25 50 L42 59 M25 58 L42 67"
          stroke="#A5B4FC"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path d="M62 52 L62 70 L76 61 Z" fill="#FFFFFF" />
      </svg>

      {/* Text — only when variant="full" */}
      {variant === "full" && (
        <span
          className={`${textSize} font-extrabold tracking-tight leading-none`}
        >
          <span className={isLight ? "text-white" : "text-slate-900"}>
            Course
          </span>
          <span className={isLight ? "text-teal-300" : "text-indigo-600"}>
            Box
          </span>
        </span>
      )}
    </div>
  );

  if (clickable && linkTo) {
    return (
      <Link
        to={linkTo}
        className="inline-flex items-center transition-opacity hover:opacity-90"
      >
        {content}
      </Link>
    );
  }

  return content;
};

export default Logo;