"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";

interface NeonButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children?: React.ReactNode;
  variant?: "blue" | "purple" | "pink" | "green" | "red";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  glow?: boolean;
}



export const NeonButton: React.FC<NeonButtonProps> = ({
  children,
  variant = "blue",
  size = "md",
  fullWidth = false,
  glow = true,
  className = "",
  ...props
}) => {
  const baseStyles =
    "relative inline-flex items-center justify-center font-bold tracking-wider uppercase transition-all duration-300 rounded-lg border focus:outline-none cursor-pointer overflow-hidden";

  const sizeStyles = {
    sm: "px-4 py-2 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base"
  };

  const variantStyles = {
    blue: {
      border: "border-neon-blue/40 bg-neon-blue/10 hover:bg-neon-blue/20 text-neon-blue",
      glow: "hover:shadow-neon-blue",
      scanLine: "bg-neon-blue/20"
    },
    purple: {
      border: "border-neon-purple/40 bg-neon-purple/10 hover:bg-neon-purple/20 text-neon-purple",
      glow: "hover:shadow-neon-purple",
      scanLine: "bg-neon-purple/20"
    },
    pink: {
      border: "border-neon-pink/40 bg-neon-pink/10 hover:bg-neon-pink/20 text-neon-pink",
      glow: "hover:shadow-neon-pink",
      scanLine: "bg-neon-pink/20"
    },
    green: {
      border: "border-neon-green/40 bg-neon-green/10 hover:bg-neon-green/20 text-neon-green",
      glow: "hover:shadow-neon-green",
      scanLine: "bg-neon-green/20"
    },
    red: {
      border: "border-neon-red/40 bg-neon-red/10 hover:bg-neon-red/20 text-neon-red",
      glow: "hover:shadow-neon-red",
      scanLine: "bg-neon-red/20"
    }
  };

  const selectedVariant = variantStyles[variant];

  return (
    <motion.button
      whileHover={{ scale: 1.04, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`
        ${baseStyles}
        ${sizeStyles[size]}
        ${selectedVariant.border}
        ${glow ? selectedVariant.glow : ""}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      {...props}
    >
      {/* Laser light scanner bar in background on hover */}
      <span className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        <span
          className={`absolute block w-full h-[2px] top-0 left-0 -translate-y-full animate-[shimmer_1.5s_infinite_linear] opacity-30 ${selectedVariant.scanLine}`}
          style={{
            background: `linear-gradient(to right, transparent, currentColor, transparent)`
          }}
        />
      </span>

      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  );
};
