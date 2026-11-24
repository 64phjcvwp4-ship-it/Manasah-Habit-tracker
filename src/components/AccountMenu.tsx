import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Cloud, LogIn, LogOut, Moon, Sun, User as UserIcon } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

export function AccountMenu({
  habitCount,
  totalStreak,
  isCloudMode,
}: {
  habitCount: number
  totalStreak: number
  isCloudMode: boolean
}) {
  const { user, authReady, signingIn, signInWithGoogle, signOutUser } = useAuth()
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const [imgError, setImgError] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setImgError(false)
  }, [user?.photoURL])

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  if (!authReady) {
    return (
      <div className="account-skeleton" aria-hidden="true">
        <style>{`
          .account-skeleton {
            width: 96px;
            height: 36px;
            border-radius: 12px;
            background: var(--surface-subtle);
          }
        `}</style>
      </div>
    )
  }

  if (!user) {
    return (
      <button
        type="button"
        className="account-signin-btn"
        onClick={() => void signInWithGoogle()}
        disabled={signingIn}
      >
        <LogIn size={15} />
        <span>{signingIn ? 'Signing in…' : 'Sign in'}</span>
        <style>{`
          .account-signin-btn {
            display: inline-flex;
            align-items: center;
            gap: 0.45rem;
            padding: 0.5rem 0.9rem;
            border-radius: 12px;
            background: var(--surface);
            border: 1px solid var(--border-strong);
            color: var(--text);
            font-size: 0.85rem;
            font-weight: 500;
            white-space: nowrap;
            transition: background 0.18s, border-color 0.18s, transform 0.15s;
          }
          .account-signin-btn:hover:not(:disabled) {
            background: color-mix(in srgb, var(--accent) 14%, transparent);
            border-color: color-mix(in srgb, var(--accent) 42%, transparent);
            transform: translateY(-1px);
          }
          .account-signin-btn:disabled {
            opacity: 0.6;
            cursor: wait;
          }
        `}</style>
      </button>
    )
  }

  const displayName = user.displayName || user.email?.split('@')[0] || 'Account'
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase() || '')
    .join('')

  return (
    <div className="account-menu-wrap" ref={menuRef}>
      <button
        type="button"
        className="account-trigger"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {user.photoURL && !imgError ? (
          <img
            src={user.photoURL}
            alt={displayName}
            className="account-avatar"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="account-avatar-fallback">
            {initials || <UserIcon size={13} />}
          </span>
        )}
        <span className="account-name">{displayName.split(' ')[0]}</span>
        <span
          className={`sync-dot ${isCloudMode ? 'online' : 'syncing'}`}
          title={isCloudMode ? 'Synced to cloud' : 'Syncing…'}
        />
        <ChevronDown size={14} className={`chevron ${open ? 'open' : ''}`} />
      </button>

      {open && (
        <div className="account-dropdown" role="menu">
          <div className="account-header">
            <strong className="account-full-name">{displayName}</strong>
            {user.email && <span className="account-email">{user.email}</span>}
            <div className="account-sync-line">
              <Cloud size={13} />
              <span>{isCloudMode ? 'Cloud sync active' : 'Connecting account…'}</span>
            </div>
          </div>

          <div className="account-metrics">
            <div>
              <strong>{habitCount}</strong>
              <span>Habits</span>
            </div>
            <div>
              <strong>{totalStreak}</strong>
              <span>Streak days</span>
            </div>
          </div>

          <div className="account-theme-row" role="group" aria-label="Appearance theme">
            <span>Theme</span>
            <div className="account-theme-pills">
              <button
                type="button"
                className={theme === 'light' ? 'active' : ''}
                aria-pressed={theme === 'light'}
                onClick={() => setTheme('light')}
              >
                <Sun size={12} />
                Light
              </button>
              <button
                type="button"
                className={theme === 'dark' ? 'active' : ''}
                aria-pressed={theme === 'dark'}
                onClick={() => setTheme('dark')}
              >
                <Moon size={12} />
                Dark
              </button>
            </div>
          </div>

          <button
            type="button"
            role="menuitem"
            className="account-signout-btn"
            onClick={() => {
              setOpen(false)
              void signOutUser()
            }}
          >
            <LogOut size={14} />
            <span>Sign out</span>
          </button>
        </div>
      )}

      <style>{`
        .account-menu-wrap {
          position: relative;
        }
        .account-trigger {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.35rem 0.65rem 0.35rem 0.4rem;
          border-radius: 12px;
          background: var(--surface);
          border: 1px solid var(--border-strong);
          color: var(--text);
          font-size: 0.84rem;
          font-weight: 500;
          white-space: nowrap;
          transition: border-color 0.18s, background 0.18s;
        }
        .account-trigger:hover {
          border-color: color-mix(in srgb, var(--accent) 45%, transparent);
          background: var(--surface-hover);
        }
        .account-avatar,
        .account-avatar-fallback {
          width: 26px;
          height: 26px;
          border-radius: 8px;
          object-fit: cover;
          flex-shrink: 0;
        }
        .account-avatar-fallback {
          display: grid;
          place-items: center;
          background: color-mix(in srgb, var(--accent) 22%, transparent);
          color: var(--accent-2);
          font-size: 0.72rem;
          font-weight: 700;
        }
        .account-name {
          max-width: 96px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .sync-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .sync-dot.online {
          background: var(--success);
          box-shadow: 0 0 8px color-mix(in srgb, var(--success) 60%, transparent);
        }
        .sync-dot.syncing {
          background: #fbbf24;
        }
        .chevron {
          opacity: 0.65;
          transition: transform 0.18s;
        }
        .chevron.open {
          transform: rotate(180deg);
        }
        .account-dropdown {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          width: 248px;
          padding: 0.85rem;
          border-radius: 16px;
          background: var(--dropdown-bg);
          border: 1px solid var(--border-strong);
          backdrop-filter: blur(16px);
          box-shadow: var(--shadow-overlay);
          z-index: 80;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .account-header {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          padding-bottom: 0.65rem;
          border-bottom: 1px solid var(--border);
        }
        .account-full-name {
          font-size: 0.92rem;
          color: var(--text);
          word-break: break-word;
        }
        .account-email {
          font-size: 0.76rem;
          color: var(--muted);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .account-sync-line {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          margin-top: 0.25rem;
          font-size: 0.74rem;
          color: var(--success-ink);
        }
        .account-metrics {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
        }
        .account-metrics > div {
          padding: 0.5rem 0.6rem;
          border-radius: 10px;
          background: var(--surface-subtle);
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
        }
        .account-metrics strong {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.05rem;
          font-variant-numeric: tabular-nums;
        }
        .account-metrics span {
          font-size: 0.72rem;
          color: var(--muted);
        }
        .account-theme-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          padding: 0.42rem 0.6rem;
          border-radius: 10px;
          background: var(--surface-subtle);
          border: 1px solid var(--border);
        }
        .account-theme-row > span {
          font-size: 0.76rem;
          font-weight: 500;
          color: var(--muted);
        }
        .account-theme-pills {
          display: inline-flex;
          gap: 0.25rem;
        }
        .account-theme-pills button {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.24rem 0.5rem;
          border-radius: 7px;
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--muted);
          transition: background 0.15s, color 0.15s;
        }
        .account-theme-pills button.active {
          background: var(--accent);
          color: var(--accent-contrast);
        }
        .account-signout-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          width: 100%;
          padding: 0.55rem 0.85rem;
          border-radius: 10px;
          background: var(--danger-bg);
          border: 1px solid var(--danger-border);
          color: var(--danger-ink);
          font-size: 0.82rem;
          font-weight: 600;
          transition: filter 0.18s;
        }
        .account-signout-btn:hover {
          filter: brightness(1.06);
        }
        @media (max-width: 640px) {
          .account-name {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}
