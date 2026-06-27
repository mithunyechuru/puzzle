"use client";

import React from "react";
import { motion } from "framer-motion";

interface GlassCardProps {
  children: React.ReactNode;
  variant?: "default" | "blue" | "purple" | "pink" | "green";
  className?: string;
  animate?: boolean;
  hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = "default",
  className = "",
  animate = true,
  hoverEffect = false
}) => {
  const variantClasses = {
    default: "border-slate-800/80 bg-slate-950/45 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]",
    blue: "border-neon-blue/20 bg-slate-950/50 shadow-[0_0_20px_rgba(6,182,212,0.1)] focus-within:border-neon-blue/40 focus-within:shadow-[0_0_25px_rgba(6,182,212,0.15)]",
    purple: "border-neon-purple/20 bg-slate-950/50 shadow-[0_0_20px_rgba(168,85,247,0.1)] focus-within:border-neon-purple/40 focus-within:shadow-[0_0_25px_rgba(168,85,247,0.15)]",
    pink: "border-neon-pink/20 bg-slate-950/50 shadow-[0_0_20px_rgba(236,72,153,0.1)] focus-within:border-neon-pink/40 focus-within:shadow-[0_0_25px_rgba(236,72,153,0.15)]",
    green: "border-neon-green/20 bg-slate-950/50 shadow-[0_0_20px_rgba(16,185,129,0.1)] focus-within:border-neon-green/40 focus-within:shadow-[0_0_25px_rgba(16,185,129,0.15)]"
  };

  const selectedClass = variantClasses[variant];
  const Component = animate ? motion.div : "div";

  const animationProps = animate
    ? {
        initial: { opacity: 0, y: 15 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 },
        ...(hoverEffect && {
          whileHover: { y: -4, boxShadow: `0 12px 40px rgba(0, 0, 0, 0.6)` }
        })
      }
    : {};

  return (
    <Component
      className={`
        backdrop-blur-md rounded-xl border p-6 text-slate-100 transition-all duration-300
        ${selectedClass}
        ${className}
      `}
      {...animationProps}
    >
      {children}
    </Component>
  );
};
