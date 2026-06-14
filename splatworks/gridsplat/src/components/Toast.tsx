interface ToastProps {
  message: string;
}

export function Toast({ message }: ToastProps) {
  if (!message) {
    return null;
  }

  return (
    <div aria-live="polite" className="toast" role="status">
      {message}
    </div>
  );
}
