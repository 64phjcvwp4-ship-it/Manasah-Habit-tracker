import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Habit } from '../lib/habits'

type ChartView = 'area' | 'bar'

type DailyCompletionPoint = {
  shortDay: string
  fullLabel: string
  dateLabel: string
  completed: number
  total: number
  percentage: number
  isToday: boolean
}

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatMonthDay(d: Date): string {
  return `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`
}

export function WeeklyCompletionSection({
  habits,
  onAddFirstHabit,
}: {
  habits: Habit[]
  onAddFirstHabit?: () => void
}) {
  const [chartView, setChartView] = useState<ChartView>('area')

  const { points, totalCompleted, totalPossible, overallPct, todayPct, todayDone, bestDay, rangeLabel } =
    useMemo(() => {
      const now = new Date()
      const totalHabits = habits.length

      const dailyPoints: DailyCompletionPoint[] = Array.from({ length: 7 }, (_, idx) => {
        const offset = 6 - idx
        const d = new Date(now)
        d.setDate(now.getDate() - offset)

        const completed = habits.reduce((sum, h) => sum + (h.history[idx] ? 1 : 0), 0)
        const percentage = totalHabits > 0 ? Math.round((completed / totalHabits) * 100) : 0
        const dayName = WEEKDAY_SHORT[d.getDay()]

        return {
          shortDay: offset === 0 ? 'Today' : dayName,
          fullLabel: offset === 0 ? `Today (${dayName})` : offset === 1 ? `Yesterday (${dayName})` : dayName,
          dateLabel: formatMonthDay(d),
          completed,
          total: totalHabits,
          percentage,
          isToday: offset === 0,
        }
      })

      const doneSum = dailyPoints.reduce((s, p) => s + p.completed, 0)
      const possibleSum = totalHabits * 7
      const avgPct = possibleSum > 0 ? Math.round((doneSum / possibleSum) * 100) : 0
      const todayPoint = dailyPoints[dailyPoints.length - 1]
      const best =
        dailyPoints.length > 0
          ? dailyPoints.reduce((prev, curr) => (curr.percentage >= prev.percentage ? curr : prev), dailyPoints[0])
          : null

      const startLabel = dailyPoints[0]?.dateLabel ?? ''
      const endLabel = dailyPoints[dailyPoints.length - 1]?.dateLabel ?? ''

      return {
        points: dailyPoints,
        totalCompleted: doneSum,
        totalPossible: possibleSum,
        overallPct: avgPct,
        todayPct: todayPoint?.percentage ?? 0,
        todayDone: todayPoint?.completed ?? 0,
        bestDay: best,
        rangeLabel: startLabel && endLabel ? `${startLabel} – ${endLabel}` : 'Last 7 days',
      }
    }, [habits])

  return (
    <div className="weekly-completion-inner">
      <div className="weekly-section-head">
        <div>
          <h2>Current week completion</h2>
          <p className="weekly-section-sub">
            <span>{rangeLabel}</span>
            <span aria-hidden="true">·</span>
            <span>
              {totalCompleted} of {totalPossible} check-ins completed across {habits.length}{' '}
              {habits.length === 1 ? 'habit' : 'habits'}
            </span>
          </p>
        </div>

        {habits.length > 0 && (
          <div className="weekly-view-switch" role="group" aria-label="Chart display style">
            <button
              type="button"
              className={chartView === 'area' ? 'active' : ''}
              aria-pressed={chartView === 'area'}
              onClick={() => setChartView('area')}
            >
              Trend
            </button>
            <button
              type="button"
              className={chartView === 'bar' ? 'active' : ''}
              aria-pressed={chartView === 'bar'}
              onClick={() => setChartView('bar')}
            >
              Daily bars
            </button>
          </div>
        )}
      </div>

      {habits.length === 0 ? (
        <div className="weekly-empty glass">
          <p>Create your first habit above to track your 7-day completion percentage.</p>
          {onAddFirstHabit && (
            <button type="button" className="weekly-empty-btn" onClick={onAddFirstHabit}>
              Add a habit
            </button>
          )}
        </div>
      ) : (
        <div className="weekly-panel glass">
          <div className="weekly-metrics-row">
            <div className="weekly-metric">
              <span className="weekly-metric-label">Weekly average</span>
              <strong className="weekly-metric-value accent">{overallPct}%</strong>
              <span className="weekly-metric-note">
                {totalCompleted}/{totalPossible} total check-ins
              </span>
            </div>

            <div className="weekly-metric">
              <span className="weekly-metric-label">Today’s completion</span>
              <strong className="weekly-metric-value">{todayPct}%</strong>
              <span className="weekly-metric-note">
                {todayDone}/{habits.length} habits done today
              </span>
            </div>

            <div className="weekly-metric">
              <span className="weekly-metric-label">Strongest day</span>
              <strong className="weekly-metric-value">
                {bestDay ? `${bestDay.percentage}%` : '0%'}
              </strong>
              <span className="weekly-metric-note">
                {bestDay ? `${bestDay.fullLabel} · ${bestDay.dateLabel}` : 'No days logged'}
              </span>
            </div>
          </div>

          <div className="weekly-chart-box" aria-label="7-day habit completion percentage chart">
            <ResponsiveContainer width="100%" height={260}>
              {chartView === 'area' ? (
                <AreaChart data={points} margin={{ top: 14, right: 12, left: -12, bottom: 4 }}>
                  <defs>
                    <linearGradient id="weeklyCompletionFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.42} />
                      <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255, 255, 255, 0.06)" vertical={false} />
                  <XAxis
                    dataKey="shortDay"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#a89bbf', fontSize: 12, fontWeight: 500 }}
                    dy={6}
                  />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={value => `${value}%`}
                    tick={{ fill: '#a89bbf', fontSize: 12 }}
                  />
                  <ReferenceLine
                    y={overallPct}
                    stroke="rgba(196, 181, 253, 0.45)"
                    strokeDasharray="4 4"
                    label={{
                      value: `Avg ${overallPct}%`,
                      position: 'insideTopRight',
                      fill: '#c4b5fd',
                      fontSize: 11,
                    }}
                  />
                  <Tooltip
                    cursor={{ stroke: 'rgba(167, 139, 250, 0.35)', strokeWidth: 1 }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const point = payload[0].payload as DailyCompletionPoint
                      return (
                        <div className="weekly-chart-tooltip">
                          <strong>
                            {point.fullLabel} · {point.dateLabel}
                          </strong>
                          <span>
                            {point.percentage}% completed ({point.completed}/{point.total} habits)
                          </span>
                        </div>
                      )
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="percentage"
                    stroke="#a78bfa"
                    strokeWidth={2.5}
                    fill="url(#weeklyCompletionFill)"
                    dot={{ r: 4, fill: '#060010', stroke: '#a78bfa', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#f0abfc', stroke: '#060010', strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                </AreaChart>
              ) : (
                <BarChart
                  data={points}
                  margin={{ top: 14, right: 12, left: -12, bottom: 4 }}
                  barCategoryGap="24%"
                >
                  <CartesianGrid stroke="rgba(255, 255, 255, 0.06)" vertical={false} />
                  <XAxis
                    dataKey="shortDay"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#a89bbf', fontSize: 12, fontWeight: 500 }}
                    dy={6}
                  />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={value => `${value}%`}
                    tick={{ fill: '#a89bbf', fontSize: 12 }}
                  />
                  <ReferenceLine
                    y={overallPct}
                    stroke="rgba(196, 181, 253, 0.45)"
                    strokeDasharray="4 4"
                    label={{
                      value: `Avg ${overallPct}%`,
                      position: 'insideTopRight',
                      fill: '#c4b5fd',
                      fontSize: 11,
                    }}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.04)', radius: 8 }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const point = payload[0].payload as DailyCompletionPoint
                      return (
                        <div className="weekly-chart-tooltip">
                          <strong>
                            {point.fullLabel} · {point.dateLabel}
                          </strong>
                          <span>
                            {point.percentage}% completed ({point.completed}/{point.total} habits)
                          </span>
                        </div>
                      )
                    }}
                  />
                  <Bar dataKey="percentage" radius={[8, 8, 4, 4]} maxBarSize={44} isAnimationActive={false}>
                    {points.map((entry, idx) => (
                      <Cell
                        key={idx}
                        fill={
                          entry.isToday
                            ? '#f0abfc'
                            : entry.percentage > 0
                              ? '#a78bfa'
                              : 'rgba(255, 255, 255, 0.14)'
                        }
                        fillOpacity={entry.percentage > 0 ? 0.92 : 1}
                      />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <style>{`
        .weekly-completion-inner {
          display: flex;
          flex-direction: column;
        }
        .weekly-section-head {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 1.25rem;
        }
        .weekly-section-head h2 {
          font-size: 1.65rem;
          text-wrap: balance;
          margin-bottom: 0.35rem;
        }
        .weekly-section-sub {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          flex-wrap: wrap;
          font-size: 0.88rem;
          color: var(--muted);
          font-variant-numeric: tabular-nums;
        }
        .weekly-view-switch {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem;
          border-radius: 10px;
          background: rgba(18, 15, 28, 0.72);
          border: 1px solid var(--border);
        }
        .weekly-view-switch button {
          padding: 0.42rem 0.85rem;
          border-radius: 7px;
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--muted);
          white-space: nowrap;
          flex-shrink: 0;
          transition: color 0.18s, background 0.18s;
        }
        .weekly-view-switch button:hover {
          color: var(--text);
        }
        .weekly-view-switch button.active {
          color: var(--text);
          background: rgba(167, 139, 250, 0.22);
        }
        .weekly-panel {
          padding: 1.5rem;
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .weekly-metrics-row {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1.25rem;
          padding-bottom: 1.25rem;
          border-bottom: 1px solid var(--border);
        }
        .weekly-metric {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .weekly-metric-label {
          font-size: 0.8rem;
          color: var(--muted);
          font-weight: 500;
        }
        .weekly-metric-value {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.85rem;
          font-weight: 700;
          line-height: 1.15;
          color: var(--text);
          font-variant-numeric: tabular-nums;
        }
        .weekly-metric-value.accent {
          color: var(--accent-2);
        }
        .weekly-metric-note {
          font-size: 0.78rem;
          color: var(--muted);
          font-variant-numeric: tabular-nums;
        }
        .weekly-chart-box {
          width: 100%;
          height: 260px;
        }
        .weekly-chart-tooltip {
          padding: 0.55rem 0.8rem;
          border-radius: 10px;
          background: rgba(12, 8, 22, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.14);
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          font-size: 0.78rem;
          color: var(--muted);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.5);
          font-variant-numeric: tabular-nums;
        }
        .weekly-chart-tooltip strong {
          color: var(--text);
          font-weight: 600;
        }
        .weekly-empty {
          padding: 2rem 1.5rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.9rem;
          color: var(--muted);
          font-size: 0.92rem;
        }
        .weekly-empty-btn {
          padding: 0.5rem 1rem;
          border-radius: 10px;
          background: rgba(167, 139, 250, 0.18);
          border: 1px solid rgba(167, 139, 250, 0.4);
          color: var(--text);
          font-size: 0.84rem;
          font-weight: 600;
          white-space: nowrap;
        }
        @media (max-width: 720px) {
          .weekly-metrics-row {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          .weekly-panel {
            padding: 1.15rem;
          }
        }
      `}</style>
    </div>
  )
}
