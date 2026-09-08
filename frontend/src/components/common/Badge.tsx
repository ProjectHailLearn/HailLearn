import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { DoubtStatus } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'brand' | 'success' | 'warning' | 'purple' | 'neutral' | 'danger';
  status?: DoubtStatus;
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  status,
  dot = false,
  className,
}) => {
  let resolvedVariant = variant;

  if (status) {
    switch (status) {
      case 'AI_RESOLVED':
        resolvedVariant = 'success';
        break;
      case 'MENTOR_ESCALATED':
        resolvedVariant = 'purple';
        break;
      case 'FACULTY_VERIFIED':
        resolvedVariant = 'brand';
        break;
      case 'ANALYZING':
        resolvedVariant = 'warning';
        break;
      case 'CLOSED':
        resolvedVariant = 'neutral';
        break;
    }
  }

  const variantStyles = {
    brand: 'bg-brand-500/10 text-brand-400 border-brand-500/30',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    danger: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    neutral: 'bg-slate-800/80 text-slate-300 border-slate-700/60',
  };

  const dotColors = {
    brand: 'bg-brand-400',
    success: 'bg-emerald-400 animate-pulse',
    warning: 'bg-amber-400 animate-ping',
    purple: 'bg-purple-400',
    danger: 'bg-rose-400',
    neutral: 'bg-slate-400',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border backdrop-blur-sm tracking-wide',
          variantStyles[resolvedVariant],
          className
        )
      )}
    >
      {dot && (
        <span className={clsx('w-1.5 h-1.5 rounded-full', dotColors[resolvedVariant])} />
      )}
      {children}
    </span>
  );
};
