import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '../hooks/useOnlineStatus'

export function OfflineIndicator() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div className="offline-pill glass" role="status" aria-live="polite">
      <WifiOff size={14} />
      <span>Offline mode — cached data active</span>
      <style>{`
        .offline-pill {
          position: fixed;
          left: 1.25rem;
          bottom: 1.25rem;
          z-index: 85;
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.48rem 0.85rem;
          border-radius: 12px;
          background: var(--warn-bg);
          border: 1px solid var(--warn-border);
          color: var(--warn-ink);
          font-size: 0.78rem;
          font-weight: 500;
          box-shadow: var(--shadow-overlay);
        }
      `}</style>
    </div>
  )
}
