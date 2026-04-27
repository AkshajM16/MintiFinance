import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BadgeProps extends Omit<HTMLMotionProps<'span'>, 'ref'> {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center rounded-full border font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';
    
    const variants = {
      default: 'border-transparent bg-blue-500/20 text-blue-400 hover:bg-blue-500/30',
      secondary: 'border-transparent bg-gray-500/20 text-gray-400 hover:bg-gray-500/30',
      outline: 'border-gray-600 text-gray-300 hover:bg-gray-800',
      destructive: 'border-transparent bg-red-500/20 text-red-400 hover:bg-red-500/30',
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-0.5 text-sm',
      lg: 'px-3 py-1 text-base',
    };

    return (
      <motion.span
        ref={ref}
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        {...props}
      >
        {children}
      </motion.span>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge }; 