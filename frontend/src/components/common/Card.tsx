import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'interactive' | 'gradient-border';
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default',
  glow = false,
  ...props
}) => {
  const baseStyles = 'rounded-2xl transition-all duration-200 relative';

  const variantStyles = {
    default: 'bg-slate-900/80 border border-slate-800 text-slate-100 shadow-xl',
    glass:
      'bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 text-slate-100 shadow-2xl',
    interactive:
      'bg-slate-900/70 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 cursor-pointer shadow-lg hover:shadow-brand-500/5 hover:-translate-y-0.5',
    'gradient-border':
      'bg-slate-900 border border-transparent bg-clip-padding relative before:absolute before:inset-0 before:-z-10 before:rounded-2xl before:p-[1px] before:bg-gradient-to-r before:from-brand-500/40 before:via-indigo-500/20 before:to-purple-500/40 shadow-xl',
  };

  return (
    <div
      className={twMerge(
        clsx(
          baseStyles,
          variantStyles[variant],
          glow && 'shadow-2xl shadow-brand-500/10 border-brand-500/30',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
