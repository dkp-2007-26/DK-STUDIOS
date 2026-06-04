import { ReactNode, ButtonHTMLAttributes } from 'react';

interface GoldButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'solid' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export default function GoldButton({ children, variant = 'solid', size = 'md', className = '', ...props }: GoldButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    solid: 'bg-gradient-to-r from-gold-600 via-gold-500 to-gold-400 text-black hover:from-gold-500 hover:to-gold-300 shadow-gold hover:shadow-gold-lg active:scale-95',
    outline: 'border-2 border-gold-500 text-gold-400 hover:bg-gold-500 hover:text-black active:scale-95',
    ghost: 'text-gold-400 hover:text-gold-300 hover:bg-white/5 active:scale-95',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}
