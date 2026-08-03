import { useEffect } from 'react';
import './Toast.css';

export type ToastType = 'info' | 'success' | 'error';

interface ToastProps {
  message: string;
  type?: ToastType;
  visible: boolean;
  onHide: () => void;
}

export default function Toast({ message, type = 'info', visible, onHide }: ToastProps) {
  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(onHide, 3200);
    return () => window.clearTimeout(timer);
  }, [visible, onHide]);

  if (!visible || !message) return null;

  return (
    <div className={`toast toast-${type}`} role="status">
      {message}
    </div>
  );
}
