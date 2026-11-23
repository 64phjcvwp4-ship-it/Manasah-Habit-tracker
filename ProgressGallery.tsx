import type { Habit } from '../App'
import { useState } from 'react'

/** AccordionGallery-inspired progress view. Replace with real component later. */
export function ProgressGallery({ habits }: { habits: Habit[] }) {
  const [active, setActive] = useState(0)

  return (
    <div className="gallery">
      {habits.map((h, i) => {
        const isActive = i === active
        return (
          <div
            key={h.id}
            className={`gallery-item ${isActive ? 'active' : ''}`}
            onMouseEnter={() => setActive(i)}
            style={{ '--c': h.color } as React.CSSProperties}
          >
            <div className="gallery-inner">
              <div className="gallery-label">{h.name}</div>
              <div className="gallery-stats">
                <div className="big">{h.streak}</div>
                <div className="label">day streak</div>
                <div className="week">
                  {h.history.map((d, di) => (
                    <span key={di} className={d ? 'on' : ''} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      })}
      <style>{`
        .gallery {
          display: flex;
          gap: 10px;
          height: 280px;
          width: 100%;
        }
        .gallery-item {
          flex: 1;
          min-width: 0;
          border-radius: 18px;
          overflow: hidden;
          background: linear-gradient(160deg, color-mix(in srgb, var(--c) 18%, #0c0618), #0c0618 70%);
          border: 1px solid rgba(255,255,255,0.06);
          transition: flex 0.45s cubic-bezier(0.22, 1, 0.36, 1);
          cursor: pointer;
          position: relative;
        }
        .gallery-item.active {
          flex: 2.4;
          border-color: color-mix(in srgb, var(--c) 40%, transparent);
          box-shadow: 0 0 40px color-mix(in srgb, var(--c) 18%, transparent);
        }
        .gallery-inner {
          height: 100%;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .gallery-label {
          font-weight: 600;
          font-size: 0.95rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          opacity: 0.9;
        }
        .gallery-stats {
          opacity: 0;
          transform: translateY(8px);
          transition: opacity 0.3s, transform 0.3s;
        }
        .gallery-item.active .gallery-stats {
          opacity: 1;
          transform: none;
        }
        .big {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 2.8rem;
          font-weight: 700;
          line-height: 1;
          color: var(--c);
        }
        .label {
          font-size: 0.8rem;
          color: var(--muted);
          margin-bottom: 0.75rem;
        }
        .week {
          display: flex;
          gap: 5px;
        }
        .week span {
          width: 10px;
          height: 10px;
          border-radius: 3px;
          background: rgba(255,255,255,0.12);
        }
        .week span.on {
          background: var(--c);
        }
        @media (max-width: 640px) {
          .gallery {
            flex-direction: column;
            height: auto;
          }
          .gallery-item {
            height: 72px;
          }
          .gallery-item.active {
            height: 180px;
          }
        }
      `}</style>
    </div>
  )
}
