import type { Habit } from '../App'
import { Check } from 'lucide-react'

export function HabitBoard({
  habits,
  onToggle,
}: {
  habits: Habit[]
  onToggle: (id: string) => void
}) {
  return (
    <div className="habit-grid">
      {habits.map(h => (
        <button
          key={h.id}
          className={`habit-card ${h.completedToday ? 'done' : ''}`}
          onClick={() => onToggle(h.id)}
          style={{ '--accent': h.color } as React.CSSProperties}
        >
          <div className="habit-top">
            <span className="habit-name">{h.name}</span>
            <span className={`check ${h.completedToday ? 'on' : ''}`}>
              <Check size={16} strokeWidth={3} />
            </span>
          </div>
          <div className="habit-meta">
            <span className="streak">{h.streak} day streak</span>
            <div className="dots">
              {h.history.map((d, i) => (
                <span key={i} className={`dot ${d ? 'filled' : ''}`} />
              ))}
            </div>
          </div>
        </button>
      ))}
      <style>{`
        .habit-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 1rem;
        }
        .habit-card {
          text-align: left;
          padding: 1.15rem 1.25rem;
          border-radius: 18px;
          background: rgba(18, 15, 28, 0.7);
          border: 1px solid rgba(255,255,255,0.07);
          backdrop-filter: blur(12px);
          transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
          color: inherit;
        }
        .habit-card:hover {
          border-color: color-mix(in srgb, var(--accent) 45%, transparent);
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.35);
        }
        .habit-card.done {
          border-color: color-mix(in srgb, var(--accent) 55%, transparent);
          box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent) 20%, transparent);
        }
        .habit-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 0.75rem;
          margin-bottom: 0.85rem;
        }
        .habit-name {
          font-weight: 600;
          font-size: 1.02rem;
        }
        .check {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.15);
          display: grid;
          place-items: center;
          color: transparent;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .check.on {
          background: var(--accent);
          border-color: var(--accent);
          color: #0a0014;
        }
        .habit-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.75rem;
        }
        .streak {
          font-size: 0.78rem;
          color: var(--muted);
        }
        .dots {
          display: flex;
          gap: 4px;
        }
        .dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: rgba(255,255,255,0.12);
        }
        .dot.filled {
          background: var(--accent);
        }
      `}</style>
    </div>
  )
}
