import { useState } from 'react'
import { Download, Share, X } from 'lucide-react'
import { usePWAInstall } from '../hooks/usePWAInstall'

export function PWAInstallButton() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall()
  const [showIOSGuide, setShowIOSGuide] = useState(false)

  if (isInstalled) {
    return null
  }

  if (isInstallable) {
    return (
      <>
        <button
          type="button"
          className="pwa-install-btn"
          onClick={() => void install()}
          title="Install Maloxie as an app"
        >
          <Download size={14} />
          <span>Install</span>
        </button>
        <style>{`
          .pwa-install-btn {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            padding: 0.45rem 0.78rem;
            border-radius: 10px;
            background: rgba(167, 139, 250, 0.16);
            border: 1px solid rgba(167, 139, 250, 0.38);
            color: var(--text);
            font-size: 0.8rem;
            font-weight: 600;
            white-space: nowrap;
            flex-shrink: 0;
            transition: background 0.18s, border-color 0.18s;
          }
          .pwa-install-btn:hover {
            background: rgba(167, 139, 250, 0.28);
            border-color: rgba(167, 139, 250, 0.6);
          }
        `}</style>
      </>
    )
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          className="pwa-install-btn"
          onClick={() => setShowIOSGuide(true)}
          title="Install Maloxie on iPhone or iPad"
        >
          <Share size={14} />
          <span>Install</span>
        </button>

        {showIOSGuide && (
          <div
            className="pwa-ios-backdrop"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-ios-title"
          >
            <div className="pwa-ios-modal glass">
              <div className="pwa-ios-head">
                <h3 id="pwa-ios-title">Install Maloxie</h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Close install guide"
                >
                  <X size={16} />
                </button>
              </div>
              <p>
                1. Tap the <strong>Share</strong> button in Safari’s toolbar.
                <br />
                2. Scroll down and tap <strong>Add to Home Screen</strong>.
              </p>
              <button
                type="button"
                className="pwa-ios-close"
                onClick={() => setShowIOSGuide(false)}
              >
                Got it
              </button>
            </div>
          </div>
        )}

        <style>{`
          .pwa-install-btn {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            padding: 0.45rem 0.78rem;
            border-radius: 10px;
            background: rgba(167, 139, 250, 0.16);
            border: 1px solid rgba(167, 139, 250, 0.38);
            color: var(--text);
            font-size: 0.8rem;
            font-weight: 600;
            white-space: nowrap;
            flex-shrink: 0;
            transition: background 0.18s, border-color 0.18s;
          }
          .pwa-install-btn:hover {
            background: rgba(167, 139, 250, 0.28);
            border-color: rgba(167, 139, 250, 0.6);
          }
          .pwa-ios-backdrop {
            position: fixed;
            inset: 0;
            z-index: 120;
            display: grid;
            place-items: center;
            padding: 1.25rem;
            background: var(--backdrop-scrim);
            backdrop-filter: blur(6px);
          }
          .pwa-ios-modal {
            width: min(360px, 100%);
            padding: 1.25rem;
            border-radius: 18px;
            background: var(--dropdown-bg);
            border: 1px solid var(--border-strong);
            box-shadow: var(--shadow-overlay);
            display: flex;
            flex-direction: column;
            gap: 0.85rem;
          }
          .pwa-ios-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .pwa-ios-head h3 {
            font-size: 1rem;
            font-weight: 600;
            color: var(--text);
          }
          .pwa-ios-head button {
            color: var(--muted);
            padding: 4px;
          }
          .pwa-ios-modal p {
            font-size: 0.86rem;
            line-height: 1.6;
            color: var(--muted);
          }
          .pwa-ios-modal strong {
            color: var(--text);
          }
          .pwa-ios-close {
            padding: 0.5rem 0.9rem;
            border-radius: 10px;
            background: var(--accent);
            color: var(--accent-contrast);
            font-size: 0.84rem;
            font-weight: 700;
          }
        `}</style>
      </>
    )
  }

  return null
}
