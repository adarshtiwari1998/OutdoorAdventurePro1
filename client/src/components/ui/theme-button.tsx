import React, { ButtonHTMLAttributes } from 'react';
import { VariantProps, cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const themeButtonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300',
  {
    variants: {
      variant: {
        default: 'bg-[hsl(var(--theme-primary))] text-white hover:bg-[hsl(var(--theme-primary-dark))]',
        outline: 'border border-[hsl(var(--theme-primary))] text-[hsl(var(--theme-primary))] hover:bg-[hsl(var(--theme-primary))] hover:text-white',
        secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-700',
        ghost: 'text-[hsl(var(--theme-primary))] hover:bg-slate-100 hover:text-[hsl(var(--theme-primary-dark))] dark:hover:bg-slate-800 dark:hover:text-slate-50',
        link: 'text-[hsl(var(--theme-primary))] underline-offset-4 hover:underline hover:text-[hsl(var(--theme-primary-dark))]',
        destructive: 'bg-red-500 text-white hover:bg-red-600 dark:bg-red-900 dark:hover:bg-red-800',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        xl: 'h-12 rounded-md px-10 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ThemeButtonProps 
  extends ButtonHTMLAttributes<HTMLButtonElement>, 
    VariantProps<typeof themeButtonVariants> {
    className?: string;
}

const ThemeButton = React.forwardRef<HTMLButtonElement, ThemeButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(themeButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

ThemeButton.displayName = 'ThemeButton';

export { ThemeButton, themeButtonVariants };