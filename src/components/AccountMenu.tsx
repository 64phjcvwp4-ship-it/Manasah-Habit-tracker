import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Cloud, LogIn, LogOut, User as UserIcon } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

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
            background: rgba(255, 255, 255, 0.06);
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
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.14);
            color: var(--text);
            font-size: 0.85rem;
            font-weight: 500;
            transition: background 0.18s, border-color 0.18s, transform 0.15s;
          }
          .account-signin-btn:hover:not(:disabled) {
            background: rgba(167, 139, 250, 0.16);
            border-color: rgba(167, 139, 250, 0.42);
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
          background: rgba(18, 15, 28, 0.78);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: var(--text);
          font-size: 0.84rem;
          font-weight: 500;
          transition: border-color 0.18s, background 0.18s;
        }
        .account-trigger:hover {
          border-color: rgba(167, 139, 250, 0.45);
          background: rgba(28, 22, 44, 0.9);
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
          background: rgba(167, 139, 250, 0.25);
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
          background: #34d399;
          box-shadow: 0 0 8px rgba(52, 211, 153, 0.65);
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
          background: rgba(14, 10, 26, 0.96);
          border: 1px solid rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(16px);
          box-shadow: 0 20px 44px rgba(0, 0, 0, 0.55);
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
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
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
          color: #34d399;
        }
        .account-metrics {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
        }
        .account-metrics > div {
          padding: 0.5rem 0.6rem;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.04);
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
        }
        .account-metrics strong {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.05rem;
        }
        .account-metrics span {
          font-size: 0.72rem;
          color: var(--muted);
        }
        .account-signout-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          width: 100%;
          padding: 0.55rem 0.85rem;
          border-radius: 10px;
          background: rgba(248, 113, 113, 0.12);
          border: 1px solid rgba(248, 113, 113, 0.28);
          color: #fca5a5;
          font-size: 0.82rem;
          font-weight: 600;
          transition: background 0.18s;
        }
        .account-signout-btn:hover {
          background: rgba(248, 113, 113, 0.22);
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
