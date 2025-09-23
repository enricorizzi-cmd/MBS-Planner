import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-neon-primary text-dark-bg hover:bg-neon-primary/80',
        secondary:
          'border-transparent bg-muted text-muted-foreground hover:bg-muted/80',
        destructive:
          'border-transparent bg-neon-danger text-white hover:bg-neon-danger/80',
        outline: 'text-foreground border-border',
        success:
          'border-transparent bg-neon-success text-white hover:bg-neon-success/80',
        warning:
          'border-transparent bg-neon-warning text-white hover:bg-neon-warning/80',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

