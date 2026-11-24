import { BellRing, Check, X } from 'lucide-react'
import type { ReminderAlert } from '../hooks/useHabitReminders'

export function ReminderToast({
  alerts,
  onComplete,
  onDismiss,
}: {
  alerts: ReminderAlert[]
  onComplete: (habitId: string, alertKey: string) => void
  onDismiss: (alertKey: string) => void
}) {
  if (alerts.length === 0) return null

  return (
    <div className="reminder-toast-stack" role="region" aria-label="Habit reminders">
      {alerts.map(alert => (
        <div
          key={alert.key}
          className="reminder-toast glass"
          style={{ '--toast-accent': alert.color } as React.CSSProperties}
          role="status"
          aria-live="polite"
        >
          <div className="reminder-toast-icon" aria-hidden="true">
            <BellRing size={16} />
          </div>
          <div className="reminder-toast-body">
            <div className="reminder-toast-meta">
              <span>{alert.isTest ? 'Reminder preview' : `Reminder · ${alert.reminderLabel}`}</span>
              <span aria-hidden="true">·</span>
              <span>{alert.category}</span>
            </div>
            <strong>{alert.habitName}</strong>
            <span className="reminder-toast-sub">
              {alert.streak > 0 ? `${alert.streak}-day streak active` : 'Ready to build consistency today'}
            </span>
          </div>
          <div className="reminder-toast-actions">
            {!alert.isTest && alert.habitId && (
              <button
                type="button"
                className="reminder-done-btn"
                onClick={() => onComplete(alert.habitId, alert.key)}
              >
                <Check size={14} />
                Done
              </button>
            )}
            <button
              type="button"
              className="reminder-dismiss-btn"
              onClick={() => onDismiss(alert.key)}
              aria-label={`Dismiss reminder for ${alert.habitName}`}
            >
              <X size={15} />
            </button>
          </div>
        </div>
      ))}

      <style>{`
        .reminder-toast-stack {
          position: fixed;
          right: 1.25rem;
          bottom: 1.25rem;
          z-index: 90;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
          width: min(360px, calc(100vw - 2rem));
        }
        .reminder-toast {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.85rem 0.95rem;
          border-radius: 16px;
          background: rgba(16, 12, 26, 0.94);
          border: 1px solid color-mix(in srgb, var(--toast-accent) 45%, rgba(255, 255, 255, 0.12));
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.5);
          animation: reminder-slide-in 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes reminder-slide-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .reminder-toast-icon {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          color: var(--toast-accent);
          background: color-mix(in srgb, var(--toast-accent) 16%, transparent);
          border: 1px solid color-mix(in srgb, var(--toast-accent) 32%, transparent);
        }
        .reminder-toast-body {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 0.12rem;
        }
        .reminder-toast-meta {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.72rem;
          color: var(--muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .reminder-toast-body strong {
          font-size: 0.92rem;
          color: var(--text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .reminder-toast-sub {
          font-size: 0.74rem;
          color: var(--muted);
        }
        .reminder-toast-actions {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          flex-shrink: 0;
        }
        .reminder-done-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.28rem;
          padding: 0.38rem 0.65rem;
          border-radius: 9px;
          background: var(--toast-accent);
          color: #0a0014;
          font-size: 0.75rem;
          font-weight: 700;
          white-space: nowrap;
        }
        .reminder-dismiss-btn {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          display: grid;
          place-items: center;
          color: var(--muted);
          transition: color 0.15s, background 0.15s;
        }
        .reminder-dismiss-btn:hover {
          color: var(--text);
          background: rgba(255, 255, 255, 0.08);
        }
      `}</style>
    </div>
  )
}
