import { useMemo } from 'react'
import { Award, TrendingUp } from 'lucide-react'
import type { Habit } from '../App'

export function WeeklySummary({ habits }: { habits: Habit[] }) {
  const summary = useMemo(() => {
    if (habits.length === 0) {
      return {
        totalCompleted: 0,
        totalSlots: 0,
        completionPct: 0,
        topHabit: null as Habit | null,
        topCompleted: 0,
        topPct: 0,
      }
    }

    let totalCompleted = 0
    let totalSlots = 0
    let topHabit: Habit | null = null
    let topCompleted = -1

    for (const h of habits) {
      const done = h.history.filter(Boolean).length
      totalCompleted += done
      totalSlots += h.history.length

      if (
        done > topCompleted ||
        (done === topCompleted && topHabit && h.streak > topHabit.streak)
      ) {
        topCompleted = done
        topHabit = h
      }
    }

    const completionPct = totalSlots > 0 ? Math.round((totalCompleted / totalSlots) * 100) : 0
    const topPct =
      topHabit && topHabit.history.length > 0
        ? Math.round((topCompleted / topHabit.history.length) * 100)
        : 0

    return {
      totalCompleted,
      totalSlots,
      completionPct,
      topHabit,
      topCompleted: Math.max(0, topCompleted),
      topPct,
    }
  }, [habits])

  if (habits.length === 0) return null

  return (
    <div className="weekly-summary-grid" aria-label="Weekly summary">
      <div className="summary-card glass">
        <div className="summary-top">
          <span className="summary-label">
            <TrendingUp size={15} />
            Weekly completion
          </span>
          <span className="summary-meta">
            {summary.totalCompleted}/{summary.totalSlots} check-ins
          </span>
        </div>
        <div className="summary-value">{summary.completionPct}%</div>
        <div className="summary-bar" aria-hidden="true">
          <div
            className="summary-bar-fill"
            style={{ width: `${summary.completionPct}%` }}
          />
        </div>
      </div>

      <div
        className="summary-card glass"
        style={
          {
            '--top-accent': summary.topHabit?.color ?? '#a78bfa',
          } as React.CSSProperties
        }
      >
        <div className="summary-top">
          <span className="summary-label top-label">
            <Award size={15} />
            Top-performing habit
          </span>
          {summary.topHabit && (
            <span className="summary-meta">
              {summary.topCompleted}/7 days · {summary.topHabit.streak}d streak
            </span>
          )}
        </div>
        <div className="summary-top-habit">
          {summary.topHabit ? (
            <>
              <span className="top-dot" />
              <span className="top-name">{summary.topHabit.name}</span>
              <span className="top-pct">{summary.topPct}%</span>
            </>
          ) : (
            <span className="summary-meta">No activity yet</span>
          )}
        </div>
      </div>

      <style>{`
        .weekly-summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 1rem;
        }
        .summary-card {
          padding: 1.15rem 1.3rem;
          border-radius: 18px;
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
          background: rgba(18, 15, 28, 0.72);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .summary-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .summary-label {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--accent-2);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .summary-label.top-label {
          color: var(--top-accent);
        }
        .summary-meta {
          font-size: 0.78rem;
          color: var(--muted);
        }
        .summary-value {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 2rem;
          font-weight: 700;
          line-height: 1.1;
          color: var(--text);
        }
        .summary-bar {
          width: 100%;
          height: 6px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.08);
          overflow: hidden;
          margin-top: 0.15rem;
        }
        .summary-bar-fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #a78bfa, #f0abfc);
          transition: width 0.35s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .summary-top-habit {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          min-height: 2.3rem;
        }
        .top-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--top-accent);
          box-shadow: 0 0 12px color-mix(in srgb, var(--top-accent) 65%, transparent);
          flex-shrink: 0;
        }
        .top-name {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .top-pct {
          margin-left: auto;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--top-accent);
          flex-shrink: 0;
        }
      `}</style>
    </div>
  )
}
