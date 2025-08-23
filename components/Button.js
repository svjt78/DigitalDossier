// components/Button.js
import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  icon: Icon,
  iconPosition = 'left',
  onClick,
  type = 'button',
  ...props
}, ref) => {
  const baseClasses = `
    relative inline-flex items-center justify-center font-medium rounded-lg
    transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed transform-gpu
  `;

  const variants = {
    primary: `
      bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25
      hover:from-blue-600 hover:to-indigo-700 hover:shadow-blue-500/30 hover:scale-105
      focus:ring-blue-500 border border-blue-400/20
      active:scale-100 active:shadow-blue-500/20
    `,
    secondary: `
      bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25
      hover:from-indigo-700 hover:to-purple-700 hover:shadow-indigo-500/30 hover:scale-105
      focus:ring-indigo-500 border border-indigo-400/20
      active:scale-100 active:shadow-indigo-500/20
    `,
    tertiary: `
      bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/25
      hover:from-blue-700 hover:to-cyan-700 hover:shadow-blue-500/30 hover:scale-105
      focus:ring-blue-500 border border-blue-400/20
      active:scale-100 active:shadow-blue-500/20
    `,
    outline: `
      bg-transparent border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white
      focus:ring-blue-500 hover:scale-105 active:scale-100
    `,
    ghost: `
      bg-transparent text-gray-300 hover:bg-gray-700/50 hover:text-white
      focus:ring-gray-500 hover:scale-105 active:scale-100
    `,
    danger: `
      bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25
      hover:from-red-600 hover:to-red-700 hover:shadow-red-500/30 hover:scale-105
      focus:ring-red-500 border border-red-400/20
      active:scale-100 active:shadow-red-500/20
    `,
    success: `
      bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25
      hover:from-green-600 hover:to-emerald-700 hover:shadow-green-500/30 hover:scale-105
      focus:ring-green-500 border border-green-400/20
      active:scale-100 active:shadow-green-500/20
    `
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
    xl: 'px-8 py-4 text-lg gap-3'
  };

  const isDisabled = disabled || loading;

  const handleClick = (e) => {
    if (isDisabled) return;
    if (onClick) onClick(e);
  };

  return (
    <button
      ref={ref}
      type={type}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isDisabled}
      onClick={handleClick}
      {...props}
    >
      {loading && (
        <Loader2 className="w-4 h-4 animate-spin" />
      )}
      
      {!loading && Icon && iconPosition === 'left' && (
        <Icon className="w-4 h-4" />
      )}
      
      {children}
      
      {!loading && Icon && iconPosition === 'right' && (
        <Icon className="w-4 h-4" />
      )}
      
      {/* Shine effect overlay */}
      <div className="absolute inset-0 rounded-lg bg-white opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" />
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
