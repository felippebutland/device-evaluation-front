import type { ReactNode } from 'react';
import { cn } from '@/utils/helpers';
import type { SubmissionStatus } from '@/types';

interface StatusBadgeProps {
  status: SubmissionStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusBadge({ status, size = 'sm', className }: StatusBadgeProps) {
  const statusConfig = {
    pending: {
      label: 'Pendente',
      color: 'bg-yellow-100 text-yellow-800',
      dot: 'bg-yellow-400'
    },
    under_evaluation: {
      label: 'Em Avaliação',
      color: 'bg-blue-100 text-blue-800',
      dot: 'bg-blue-400'
    },
    approved: {
      label: 'Aprovado',
      color: 'bg-green-100 text-green-800',
      dot: 'bg-green-400'
    },
    rejected: {
      label: 'Rejeitado',
      color: 'bg-red-100 text-red-800',
      dot: 'bg-red-400'
    }
  } as const;

  const config = statusConfig[status];
  if (!config) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        config.color,
        {
          'px-2.5 py-0.5 text-xs': size === 'sm',
          'px-3 py-1 text-sm': size === 'md',
        },
        className
      )}
    >
      <span
        className={cn(
          'w-2 h-2 rounded-full mr-1.5',
          config.dot
        )}
      />
      {config.label}
    </span>
  );
}

// Generic badge component for other status types
interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  const variantStyles = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        variantStyles[variant],
        {
          'px-2.5 py-0.5 text-xs': size === 'sm',
          'px-3 py-1 text-sm': size === 'md',
        },
        className
      )}
    >
      {children}
    </span>
  );
}

// Device condition badge
export function ConditionBadge({ condition }: { condition: string }) {
  const conditionConfig = {
    excellent: { label: 'Excelente', variant: 'success' as const },
    good: { label: 'Boa', variant: 'info' as const },
    fair: { label: 'Regular', variant: 'warning' as const },
    poor: { label: 'Ruim', variant: 'warning' as const },
    damaged: { label: 'Danificado', variant: 'error' as const }
  } as const;

  const config = conditionConfig[condition as keyof typeof conditionConfig];
  if (!config) return <Badge>{condition}</Badge>;

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

// Sale mode badge
export function SaleModeBadge({ mode }: { mode: 'sale' | 'exchange' }) {
  const modeConfig = {
    sale: { label: 'Venda', variant: 'success' as const },
    exchange: { label: 'Troca', variant: 'info' as const }
  } as const;

  const config = modeConfig[mode];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
