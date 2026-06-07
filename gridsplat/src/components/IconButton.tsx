import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  icon: ReactNode;
}

export function IconButton({
  children,
  className = '',
  icon,
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      className={`icon-button ${className}`.trim()}
      type={type}
      {...props}
    >
      <span className="button-icon">{icon}</span>
      <span>{children}</span>
    </button>
  );
}
