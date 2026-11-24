import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { Habit } from '../App'
import AccordionGallery from './AccordionGallery.jsx'
import { WeeklySummary } from './WeeklySummary'

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function buildHabitCardSvg(habit: Habit): string {
  const days = getLast7DayLabels()
  const doneCount = habit.history.filter(Boolean).length
  const pct = Math.round((doneCount / habit.history.length) * 100)

  const bars = habit.history
    .map((done, idx) => {
      const x = 60 + idx * 54
      const h = done ? 110 : 32
      const y = 410 - h
      const fill = done ? habit.color : 'rgba(255,255,255,0.14)'
      const opacity = done ? '0.95' : '0.55'
      return `
        <rect x="${x}" y="${y}" width="32" height="${h}" rx="8" fill="${fill}" opacity="${opacity}" />
        <text x="${x + 16}" y="442" text-anchor="middle" fill="#a89bbf" font-family="Inter, system-ui, sans-serif" font-size="13" font-weight="600">${escapeXml(days[idx].short)}</text>
      `
    })
    .join('')

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 600" width="480" height="600">
    <defs>
      <radialGradient id="glow" cx="50%" cy="28%" r="65%">
        <stop offset="0%" stop-color="${habit.color}" stop-opacity="0.38" />
        <stop offset="55%" stop-color="${habit.color}" stop-opacity="0.06" />
        <stop offset="100%" stop-color="#070311" stop-opacity="0" />
      </radialGradient>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#140f24" />
        <stop offset="100%" stop-color="#070311" />
      </linearGradient>
    </defs>
    <rect width="480" height="600" fill="url(#bg)" />
    <rect width="480" height="600" fill="url(#glow)" />
    <text x="60" y="96" fill="${habit.color}" font-family="Inter, system-ui, sans-serif" font-size="15" font-weight="600" letter-spacing="2">7-DAY CONSISTENCY</text>
    <text x="60" y="196" fill="#f4f0ff" font-family="Space Grotesk, system-ui, sans-serif" font-size="96" font-weight="700">${habit.streak}</text>
    <text x="60" y="234" fill="#a89bbf" font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="500">day streak · ${pct}% this week</text>
    <line x1="60" y1="270" x2="420" y2="270" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
    ${bars}
    <text x="60" y="510" fill="#f4f0ff" font-family="Space Grotesk, system-ui, sans-serif" font-size="22" font-weight="600">${escapeXml(habit.name)}</text>
  </svg>`

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getLast7DayLabels(): { short: string; full: string }[] {
  const now = new Date()
  return Array.from({ length: 7 }, (_, idx) => {
    const offset = 6 - idx
    const d = new Date(now)
    d.setDate(now.getDate() - offset)
    const dayName = WEEKDAYS[d.getDay()]
    if (offset === 0) return { short: 'Today', full: `Today (${dayName})` }
    if (offset === 1) return { short: dayName.slice(0, 1), full: `Yesterday (${dayName})` }
    return { short: dayName.slice(0, 1), full: dayName }
  })
}

type DayPoint = {
  day: string
  fullDay: string
  value: number
  completed: boolean
}

function HabitWeeklyChart({
  habit,
  dayLabels,
}: {
  habit: Habit
  dayLabels: { short: string; full: string }[]
}) {
  const data: DayPoint[] = useMemo(
    () =>
      habit.history.map((done, idx) => ({
        day: dayLabels[idx]?.short ?? `D${idx + 1}`,
        fullDay: dayLabels[idx]?.full ?? `Day ${idx + 1}`,
        value: done ? 1 : 0.16,
        completed: done,
      })),
    [habit.history, dayLabels]
  )

  const doneCount = habit.history.filter(Boolean).length
  const consistency = Math.round((doneCount / habit.history.length) * 100)

  return (
    <div
      className="weekly-chart-card"
      style={{ '--habit-accent': habit.color } as React.CSSProperties}
    >
      <div className="weekly-chart-head">
        <div className="weekly-chart-title">
          <span className="weekly-dot" />
          <span>{habit.name}</span>
        </div>
        <span className="weekly-pct">{consistency}%</span>
      </div>

      <div className="weekly-chart-meta">
        <span>{doneCount}/7 days</span>
        <span>{habit.streak}d streak</span>
      </div>

      <div className="weekly-chart-canvas">
        <ResponsiveContainer width="100%" height={108}>
          <BarChart data={data} margin={{ top: 8, right: 2, left: 2, bottom: 0 }} barCategoryGap="24%">
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              interval={0}
              tick={{ fill: '#a89bbf', fontSize: 11, fontWeight: 500 }}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255, 255, 255, 0.04)', radius: 6 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const point = payload[0].payload as DayPoint
                return (
                  <div className="weekly-tooltip">
                    <strong>{point.fullDay}</strong>
                    <span style={{ color: point.completed ? habit.color : '#a89bbf' }}>
                      {point.completed ? 'Completed' : 'Missed'}
                    </span>
                  </div>
                )
              }}
            />
            <Bar dataKey="value" radius={[6, 6, 4, 4]} maxBarSize={24} isAnimationActive={false}>
              {data.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={entry.completed ? habit.color : 'rgba(255, 255, 255, 0.12)'}
                  fillOpacity={entry.completed ? 0.92 : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function ProgressGallery({ habits }: { habits: Habit[] }) {
  const dayLabels = useMemo(() => getLast7DayLabels(), [])

  const items = useMemo(
    () =>
      habits.map(h => ({
        image: buildHabitCardSvg(h),
        label: `${h.name} · ${h.streak}d`,
        link: '',
        alt: `${h.name} habit progress: ${h.streak} day streak`,
      })),
    [habits]
  )

  if (items.length === 0) return null

  return (
    <div className="progress-gallery-wrap">
      <WeeklySummary habits={habits} />
      <AccordionGallery
        items={items}
        defaultIndex={0}
        accentColor="#a78bfa"
        overlayColor="#060010"
        textColor="#f4f0ff"
        height={320}
        gap={10}
        radius={18}
        expandRatio={0.52}
        trigger="hover"
        showLabels
        grayscale={false}
      />

      <div className="weekly-charts-block">
        <div className="weekly-charts-header">
          <h3>Last 7 days activity</h3>
          <span>Per-habit consistency</span>
        </div>
        <div className="weekly-charts-grid">
          {habits.map(habit => (
            <HabitWeeklyChart key={habit.id} habit={habit} dayLabels={dayLabels} />
          ))}
        </div>
      </div>

      <style>{`
        .progress-gallery-wrap {
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
        }
        .weekly-charts-block {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .weekly-charts-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 1rem;
        }
        .weekly-charts-header h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text);
        }
        .weekly-charts-header span {
          font-size: 0.8rem;
          color: var(--muted);
        }
        .weekly-charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 1rem;
        }
        .weekly-chart-card {
          padding: 1.05rem 1.15rem 0.9rem;
          border-radius: 18px;
          background: rgba(18, 15, 28, 0.72);
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          transition: border-color 0.2s, transform 0.2s;
        }
        .weekly-chart-card:hover {
          border-color: color-mix(in srgb, var(--habit-accent) 45%, transparent);
          transform: translateY(-2px);
        }
        .weekly-chart-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          margin-bottom: 0.25rem;
        }
        .weekly-chart-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          font-size: 0.95rem;
          min-width: 0;
        }
        .weekly-chart-title span:last-child {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .weekly-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--habit-accent);
          box-shadow: 0 0 10px color-mix(in srgb, var(--habit-accent) 60%, transparent);
          flex-shrink: 0;
        }
        .weekly-pct {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--habit-accent);
          flex-shrink: 0;
          font-variant-numeric: tabular-nums;
        }
        .weekly-chart-meta {
          display: flex;
          justify-content: space-between;
          font-size: 0.76rem;
          color: var(--muted);
          margin-bottom: 0.35rem;
          font-variant-numeric: tabular-nums;
        }
        .weekly-chart-canvas {
          width: 100%;
          height: 108px;
        }
        .weekly-tooltip {
          padding: 0.45rem 0.65rem;
          border-radius: 10px;
          background: rgba(12, 8, 22, 0.94);
          border: 1px solid rgba(255, 255, 255, 0.14);
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          font-size: 0.76rem;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
        }
        .weekly-tooltip strong {
          color: #f4f0ff;
          font-weight: 600;
        }
      `}</style>
    </div>
  )
}
