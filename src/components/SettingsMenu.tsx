import { useEffect, useRef, useState } from 'react'
import { Bell, Moon, SlidersHorizontal, Sun, X } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import type { NotificationPermissionState } from '../hooks/useHabitReminders'

export function SettingsMenu({
  notificationPermission,
  onRequestNotifications,
}: {
  notificationPermission?: NotificationPermissionState
  onRequestNotifications?: () => void
}) {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  return (
    <div className="settings-menu-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`settings-trigger ${open ? 'open' : ''}`}
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Open appearance and app settings"
        title="Settings"
      >
        <SlidersHorizontal size={15} />
        <span className="settings-trigger-label">Settings</span>
      </button>

      {open && (
        <div className="settings-popover" role="dialog" aria-label="App settings">
          <div className="settings-popover-head">
            <span>Settings</span>
            <button
              type="button"
              className="settings-close-btn"
              onClick={() => setOpen(false)}
              aria-label="Close settings"
            >
              <X size={15} />
            </button>
          </div>

          <div className="settings-group">
            <div className="settings-group-label">Appearance</div>
            <div className="theme-segmented" role="group" aria-label="Choose theme mode">
              <button
                type="button"
                className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                aria-pressed={theme === 'light'}
                onClick={() => setTheme('light')}
              >
                <Sun size={14} />
                <span>Light</span>
              </button>
              <button
                type="button"
                className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                aria-pressed={theme === 'dark'}
                onClick={() => setTheme('dark')}
              >
                <Moon size={14} />
                <span>Dark</span>
              </button>
            </div>
          </div>

          {notificationPermission && (
            <div className="settings-group">
              <div className="settings-group-label">Daily reminders</div>
              <div className="settings-notif-row">
                <span className="settings-notif-status">
                  <Bell size={13} />
                  <span>
                    {notificationPermission === 'granted'
                      ? 'Notifications allowed'
                      : notificationPermission === 'denied'
                        ? 'Blocked in browser'
                        : notificationPermission === 'unsupported'
                          ? 'In-app alerts only'
                          : 'Permission not set'}
                  </span>
                </span>
                {notificationPermission === 'default' && onRequestNotifications && (
                  <button
                    type="button"
                    className="settings-enable-btn"
                    onClick={() => void onRequestNotifications()}
                  >
                    Allow
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        .settings-menu-wrap {
          position: relative;
          flex-shrink: 0;
        }
        .settings-trigger {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          min-height: 38px;
          padding: 0.45rem 0.78rem;
          border-radius: 11px;
          background: var(--surface);
          border: 1px solid var(--border-strong);
          color: var(--text);
          font-size: 0.82rem;
          font-weight: 500;
          white-space: nowrap;
          flex-shrink: 0;
          transition: border-color 0.18s, background 0.18s;
        }
        .settings-trigger:hover,
        .settings-trigger.open {
          border-color: color-mix(in srgb, var(--accent) 50%, transparent);
          background: var(--surface-hover);
        }
        .settings-popover {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          width: 248px;
          padding: 0.9rem;
          border-radius: 16px;
          background: var(--dropdown-bg);
          border: 1px solid var(--border-strong);
          backdrop-filter: blur(16px);
          box-shadow: var(--shadow-overlay);
          z-index: 85;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }
        .settings-popover-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.92rem;
          font-weight: 600;
          color: var(--text);
          padding-bottom: 0.55rem;
          border-bottom: 1px solid var(--border);
        }
        .settings-close-btn {
          width: 26px;
          height: 26px;
          border-radius: 7px;
          display: grid;
          place-items: center;
          color: var(--muted);
          transition: color 0.15s, background 0.15s;
        }
        .settings-close-btn:hover {
          color: var(--text);
          background: var(--surface-hover);
        }
        .settings-group {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }
        .settings-group-label {
          font-size: 0.74rem;
          font-weight: 600;
          color: var(--muted);
        }
        .theme-segmented {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.35rem;
          padding: 0.25rem;
          border-radius: 11px;
          background: var(--surface-subtle);
          border: 1px solid var(--border);
        }
        .theme-option {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.38rem;
          padding: 0.44rem 0.65rem;
          border-radius: 8px;
          color: var(--muted);
          font-size: 0.8rem;
          font-weight: 600;
          white-space: nowrap;
          transition: background 0.18s, color 0.18s, box-shadow 0.18s;
        }
        .theme-option:hover {
          color: var(--text);
        }
        .theme-option.active {
          background: var(--accent);
          color: var(--accent-contrast);
          box-shadow: 0 2px 8px color-mix(in srgb, var(--accent) 30%, transparent);
        }
        .settings-notif-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          padding: 0.48rem 0.6rem;
          border-radius: 10px;
          background: var(--surface-subtle);
          border: 1px solid var(--border);
        }
        .settings-notif-status {
          display: inline-flex;
          align-items: center;
          gap: 0.38rem;
          font-size: 0.76rem;
          color: var(--muted);
          min-width: 0;
        }
        .settings-enable-btn {
          padding: 0.25rem 0.55rem;
          border-radius: 7px;
          background: color-mix(in srgb, var(--accent) 18%, transparent);
          border: 1px solid color-mix(in srgb, var(--accent) 42%, transparent);
          color: var(--accent-2);
          font-size: 0.74rem;
          font-weight: 600;
          white-space: nowrap;
        }
        @media (max-width: 640px) {
          .settings-trigger {
            padding: 0.45rem 0.58rem;
          }
          .settings-trigger-label {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}
