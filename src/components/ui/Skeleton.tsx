import type { HTMLAttributes } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className = '',
  variant = 'text',
  width,
  height,
  style,
  ...props
}: SkeletonProps) {
  const variants = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-xl',
  };

  return (
    <div
      className={`animate-shimmer bg-[hsl(var(--muted))] ${variants[variant]} ${className}`}
      style={{
        width: width ?? (variant === 'text' ? '100%' : undefined),
        height: height ?? (variant === 'text' ? '1em' : undefined),
        ...style,
      }}
      {...props}
    />
  );
}

// Pre-built skeleton components for common use cases
export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" width={56} height={56} />
        <div className="flex-1 space-y-2">
          <Skeleton height={24} width="60%" />
          <Skeleton height={16} width="40%" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
      <div className="flex items-center gap-4">
        <Skeleton variant="rounded" width={56} height={56} />
        <div className="flex-1 space-y-2">
          <Skeleton height={32} width="50%" />
          <Skeleton height={14} width="70%" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
      <div className="flex items-center gap-2 mb-4">
        <Skeleton variant="circular" width={20} height={20} />
        <Skeleton height={20} width="40%" />
      </div>
      <div className="h-56 flex items-end justify-around gap-2 pt-4">
        {[40, 65, 45, 80, 55, 70, 50].map((h, i) => (
          <Skeleton key={i} variant="rounded" width="12%" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonContactCard() {
  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-4">
          <Skeleton variant="circular" width={48} height={48} />
          <div className="flex-1 space-y-2">
            <Skeleton height={18} width="70%" />
            <Skeleton height={14} width="50%" />
            <div className="flex gap-1 pt-1">
              <Skeleton variant="rounded" height={20} width={50} />
              <Skeleton variant="rounded" height={20} width={40} />
            </div>
          </div>
        </div>
      </div>
      <div className="flex border-t border-[hsl(var(--border))]">
        <Skeleton className="flex-1 h-12 rounded-none" />
        <Skeleton className="flex-1 h-12 rounded-none border-x border-[hsl(var(--border))]" />
        <Skeleton className="flex-1 h-12 rounded-none" />
      </div>
    </div>
  );
}

export function SkeletonListItem() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1 space-y-2">
        <Skeleton height={16} width="60%" />
        <Skeleton height={12} width="40%" />
      </div>
      <Skeleton variant="rounded" height={24} width={40} />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
      <div className="border-b border-[hsl(var(--border))] p-4 flex gap-4">
        <Skeleton height={16} width="20%" />
        <Skeleton height={16} width="30%" />
        <Skeleton height={16} width="25%" />
        <Skeleton height={16} width="15%" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-b border-[hsl(var(--border))] last:border-0 p-4 flex gap-4 items-center">
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton height={14} width="25%" />
          <Skeleton height={14} width="30%" />
          <Skeleton height={14} width="20%" />
        </div>
      ))}
    </div>
  );
}
