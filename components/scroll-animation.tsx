'use client';

import { cn } from '@/lib/utils';
import {
  HTMLMotionProps,
  motion,
  TargetAndTransition,
} from 'motion/react';
import React from 'react';
type Direction = 'up' | 'down' | 'left' | 'right';

const generateVariants = (
  direction: Direction
): { hidden: TargetAndTransition; visible: TargetAndTransition } => {
  const horizontal = direction === 'left' || direction === 'right';
  const value = direction === 'right' || direction === 'down' ? 100 : -100;

  return {
    hidden: { filter: 'blur(10px)', opacity: 0, x: horizontal ? value : 0, y: horizontal ? 0 : value },
    visible: {
      filter: 'blur(0px)',
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  };
};

const defaultViewport = { amount: 0.3, margin: '0px 0px -200px 0px' };
type MotionComponentProps = HTMLMotionProps<'div'>;

export interface ScrollElementProps extends Omit<MotionComponentProps, 'children'> {
  children: React.ReactNode;
  className?: string;
  variants?: {
    hidden?: TargetAndTransition;
    visible?: TargetAndTransition;
  };
  viewport?: {
    amount?: number;
    margin?: string;
    once?: boolean;
  };
  delay?: number;
  direction?: Direction;
}

function ScrollElement({
  children,
  className,
  variants,
  viewport = defaultViewport,
  delay = 0, 
  direction = 'down',
  ...rest
}: ScrollElementProps) {
  const baseVariants = variants || generateVariants(direction);
  const modifiedVariants = {
    hidden: baseVariants.hidden || {},
    visible: {
      ...baseVariants.visible,
      transition: {
        ...baseVariants.visible?.transition,
        delay, 
      },
    },
  };

  return (
    <motion.div
      whileInView='visible'
      initial='hidden'
      variants={modifiedVariants}
      viewport={viewport}
      className={cn(className)}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
export default ScrollElement;
