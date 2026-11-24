import { useEffect, useRef } from 'react'
import { Flame, Sparkles, Trophy, X } from 'lucide-react'
import { StarButton } from './StarButton'
import type { Habit } from '../App'

export type MilestoneEvent = {
  habit: Habit
  milestone: number
}

const MILESTONE_COPY: Record<number, { title: string; subtitle: string }> = {
  3: {
    title: '3-Day Spark',
    subtitle: 'Three days in a row. The hardest part is starting — you just built momentum.',
  },
  7: {
    title: '7-Day Streak',
    subtitle: 'A full week of showing up. Consistency is turning into identity.',
  },
  14: {
    title: '14-Day Rhythm',
    subtitle: 'Two unbroken weeks. This habit is becoming part of your daily wiring.',
  },
  21: {
    title: '21-Day Ritual',
    subtitle: 'Three weeks strong. What used to take willpower now runs on groove.',
  },
  30: {
    title: '30-Day Legend',
    subtitle: 'A full month of discipline. Few people stay this consistent — take a bow.',
  },
  50: {
    title: '50-Day Force',
    subtitle: 'Fifty days without blinking. That is serious compounding.',
  },
  66: {
    title: '66-Day Automatic',
    subtitle: 'Research says 66 days locks in a habit for good. You made it.',
  },
  100: {
    title: '100-Day Century',
    subtitle: 'Triple digits. Unstoppable focus and follow-through.',
  },
  365: {
    title: '365-Day Mastery',
    subtitle: 'A full year of consistency. An extraordinary standard.',
  },
}

export function MilestoneModal({
  event,
  onClose,
}: {
  event: MilestoneEvent | null
  onClose: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!event) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [event, onClose])

  useEffect(() => {
    if (!event) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    if (reduced) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const resize = () => {
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const palette = [event.habit.color, '#a78bfa', '#f0abfc', '#34d399', '#fbbf24', '#ffffff']
    const cx = window.innerWidth / 2
    const cy = window.innerHeight / 2

    const particles = Array.from({ length: 75 }, (_, i) => {
      const angle = (Math.PI * 2 * i) / 75 + (Math.random() - 0.5) * 0.25
      const speed = 4 + Math.random() * 9
      return {
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        size: 4 + Math.random() * 5,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.22,
        color: palette[i % palette.length],
        life: 1,
        decay: 0.011 + Math.random() * 0.008,
        shape: i % 3,
      }
    })

    let raf = 0
    const tick = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      let alive = false
      for (const p of particles) {
        if (p.life <= 0) continue
        alive = true
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.22
        p.vx *= 0.985
        p.rotation += p.vRot
        p.life -= p.decay

        ctx.save()
        ctx.globalAlpha = Math.max(0, p.life)
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.fillStyle = p.color
        if (p.shape === 0) {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65)
        } else if (p.shape === 1) {
          ctx.beginPath()
          ctx.arc(0, 0, p.size * 0.45, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.beginPath()
          ctx.moveTo(0, -p.size * 0.6)
          ctx.lineTo(p.size * 0.5, p.size * 0.5)
          ctx.lineTo(-p.size * 0.5, p.size * 0.5)
          ctx.closePath()
          ctx.fill()
        }
        ctx.restore()
      }
      if (alive) {
        raf = requestAnimationFrame(tick)
      }
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [event])

  if (!event) return null

  const { habit, milestone } = event
  const copy = MILESTONE_COPY[milestone] ?? {
    title: `${milestone}-Day Milestone`,
    subtitle: `${milestone} days of showing up for yourself. Keep the chain unbroken.`,
  }

  return (
    <div
      className="milestone-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="milestone-title"
    >
      <canvas ref={canvasRef} className="milestone-confetti" aria-hidden="true" />

      <div
        className="milestone-card glass"
        onClick={e => e.stopPropagation()}
        style={{ '--milestone-accent': habit.color } as React.CSSProperties}
      >
        <button className="milestone-close" onClick={onClose} aria-label="Close celebration">
          <X size={18} />
        </button>

        <div className="milestone-emblem">
          <div className="milestone-ring" />
          <div className="milestone-icon">
            <Trophy size={30} />
          </div>
        </div>

        <div className="milestone-pill">
          <Sparkles size={13} />
          Milestone Unlocked
        </div>

        <h2 id="milestone-title">{copy.title}</h2>
        <p className="milestone-habit">
          <Flame size={15} />
          <span>{habit.name}</span>
          <strong>· {milestone} days</strong>
        </p>
        <p className="milestone-sub">{copy.subtitle}</p>

        <StarButton onClick={onClose}>Keep going</StarButton>
      </div>

      <style>{`
        .milestone-backdrop {
          position: fixed;
          inset: 0;
          z-index: 120;
          display: grid;
          place-items: center;
          padding: 1.5rem;
          background: var(--backdrop-scrim);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          animation: milestoneFade 0.25s ease-out;
        }
        .milestone-confetti {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 121;
        }
        .milestone-card {
          position: relative;
          z-index: 122;
          width: 100%;
          max-width: 420px;
          padding: 2.25rem 2rem 2rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.85rem;
          background: var(--dropdown-bg);
          border: 1px solid color-mix(in srgb, var(--milestone-accent) 40%, var(--border-strong));
          box-shadow:
            var(--shadow-overlay),
            0 0 60px color-mix(in srgb, var(--milestone-accent) 20%, transparent);
          animation: milestonePop 0.42s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .milestone-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          color: var(--muted);
          padding: 6px;
          border-radius: 8px;
          transition: color 0.15s, background 0.15s;
        }
        .milestone-close:hover {
          color: var(--text);
          background: var(--surface-hover);
        }
        .milestone-emblem {
          position: relative;
          width: 84px;
          height: 84px;
          display: grid;
          place-items: center;
          margin-bottom: 0.25rem;
        }
        .milestone-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: radial-gradient(circle, color-mix(in srgb, var(--milestone-accent) 35%, transparent), transparent 70%);
          animation: milestonePulse 2.2s ease-in-out infinite;
        }
        .milestone-icon {
          position: relative;
          width: 64px;
          height: 64px;
          border-radius: 20px;
          display: grid;
          place-items: center;
          background: color-mix(in srgb, var(--milestone-accent) 18%, var(--surface-solid));
          border: 1px solid color-mix(in srgb, var(--milestone-accent) 55%, transparent);
          color: var(--milestone-accent);
          box-shadow: 0 0 28px color-mix(in srgb, var(--milestone-accent) 28%, transparent);
        }
        .milestone-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.3rem 0.75rem;
          border-radius: 999px;
          font-size: 0.74rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--milestone-accent);
          background: color-mix(in srgb, var(--milestone-accent) 14%, transparent);
          border: 1px solid color-mix(in srgb, var(--milestone-accent) 32%, transparent);
        }
        .milestone-card h2 {
          font-size: 1.75rem;
          line-height: 1.15;
          color: var(--text);
        }
        .milestone-habit {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.95rem;
          color: var(--text);
        }
        .milestone-habit svg {
          color: var(--milestone-accent);
        }
        .milestone-habit strong {
          color: var(--milestone-accent);
          font-family: 'Space Grotesk', sans-serif;
        }
        .milestone-sub {
          color: var(--muted);
          font-size: 0.92rem;
          line-height: 1.5;
          margin-bottom: 0.5rem;
        }
        @keyframes milestoneFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes milestonePop {
          from { opacity: 0; transform: scale(0.88) translateY(16px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes milestonePulse {
          0%, 100% { transform: scale(0.95); opacity: 0.75; }
          50% { transform: scale(1.18); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
