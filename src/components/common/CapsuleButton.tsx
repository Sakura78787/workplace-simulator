import { motion } from 'framer-motion'
import type { HTMLMotionProps } from 'framer-motion'
import type { ReactNode } from 'react'

type CapsuleVariant = 'default' | 'warning' | 'disabled'

type CapsuleButtonProps = {
  variant?: CapsuleVariant
  children: ReactNode
} & Omit<HTMLMotionProps<'button'>, 'children'>

const variantClassName: Record<CapsuleVariant, string> = {
  default:
    'bg-sunset text-text-primary shadow-[0_8px_24px_rgba(255,170,165,0.35)] hover:bg-sunset/95',
  warning:
    'bg-critical text-white shadow-[0_8px_24px_rgba(255,107,107,0.35)] hover:bg-critical/95',
  disabled: 'bg-text-secondary/30 text-text-secondary/80 shadow-none',
}

export function CapsuleButton({
  variant = 'default',
  children,
  disabled,
  className = '',
  ...props
}: CapsuleButtonProps) {
  const isDisabled = disabled || variant === 'disabled'

  return (
    <motion.button
      type="button"
      className={[
        'inline-flex min-h-11 items-center justify-center rounded-full px-6 py-3 font-heading text-base font-semibold',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-babyblue/70',
        isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        variantClassName[variant],
        className,
      ].join(' ')}
      whileTap={isDisabled ? undefined : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 520, damping: 28, mass: 0.75 }}
      disabled={isDisabled}
      {...props}
    >
      {children}
    </motion.button>
  )
}
