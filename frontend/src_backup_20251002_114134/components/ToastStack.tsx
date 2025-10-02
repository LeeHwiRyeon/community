import React, { useEffect } from "react";

export type ToastNotification = {
  id: string;
  title: string;
  message: string;
  icon?: string;
  color?: string;
  type?: string;
  createdAt?: string;
};

type ToastStackProps = {
  notifications: ToastNotification[];
  onDismiss: (id: string) => void;
  autoDismissMs?: number;
};

const COLOR_MAP: Record<string, { background: string }> = {
  emerald: { background: 'linear-gradient(135deg, #059669, #10b981)' },
  sky: { background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)' },
  indigo: { background: 'linear-gradient(135deg, #4338ca, #6366f1)' },
  rose: { background: 'linear-gradient(135deg, #be123c, #f43f5e)' }
};

const ToastStack: React.FC<ToastStackProps> = ({ notifications, onDismiss, autoDismissMs = 6000 }) => {
  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="true">
      {notifications.map((notification) => (
        <Toast key={notification.id} notification={notification} onDismiss={onDismiss} autoDismissMs={autoDismissMs} />
      ))}
    </div>
  );
};

const Toast: React.FC<{ notification: ToastNotification; onDismiss: (id: string) => void; autoDismissMs: number }> = ({ notification, onDismiss, autoDismissMs }) => {
  useEffect(() => {
    if (!autoDismissMs) return;
    const timer = window.setTimeout(() => onDismiss(notification.id), autoDismissMs);
    return () => window.clearTimeout(timer);
  }, [notification.id, autoDismissMs, onDismiss]);

  const palette = COLOR_MAP[notification.color ?? 'indigo'] ?? COLOR_MAP.indigo;

  return (
    <div className="toast" style={{ background: palette.background }}>
      <div className="toast__icon" aria-hidden>{notification.icon ?? '✨'}</div>
      <div className="toast__body">
        <strong>{notification.title}</strong>
        <p>{notification.message}</p>
        {notification.createdAt && <span className="toast__timestamp">{new Date(notification.createdAt).toLocaleString()}</span>}
      </div>
      <button className="toast__close" onClick={() => onDismiss(notification.id)} aria-label="알림 닫기">
        ×
      </button>
    </div>
  );
};

export default ToastStack;
