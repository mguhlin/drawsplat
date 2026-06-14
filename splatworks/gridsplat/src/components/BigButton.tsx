import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface BigButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  icon?: ReactNode;
  variant?: 'primary' | 'secondary';
}

export function BigButton({
  children,
  className = '',
  icon,
  variant = 'primary',
  type = 'button',
  ...props
}: BigButtonProps) {
  return (
    <button
      className={`big-button ${variant} ${className}`.trim()}
      type={type}
      {...props}
    >
      {icon ? <span className="button-icon">{icon}</span> : null}
      <span>{children}</span>
    </button>
  );
}
