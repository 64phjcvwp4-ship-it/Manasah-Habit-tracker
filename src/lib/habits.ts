import { VALIDATION_LIMITS } from '../firebase'

export const HABIT_CATEGORIES = ['Mindfulness', 'Focus', 'Fitness', 'Reflection', 'Other'] as const
export type HabitCategory = (typeof HABIT_CATEGORIES)[number]

export interface CategoryMeta {
  name: HabitCategory
  color: string
  darkInk: string
  lightInk: string
  description: string
}

export const CATEGORY_META: Record<HabitCategory, CategoryMeta> = {
  Mindfulness: {
    name: 'Mindfulness',
    color: '#8b5cf6',
    darkInk: '#c4b5fd',
    lightInk: '#5b21b6',
    description: 'Calm, meditation & breathwork',
  },
  Focus: {
    name: 'Focus',
    color: '#10b981',
    darkInk: '#6ee7b7',
    lightInk: '#047857',
    description: 'Deep work, study & reading',
  },
  Fitness: {
    name: 'Fitness',
    color: '#f59e0b',
    darkInk: '#fcd34d',
    lightInk: '#b45309',
    description: 'Movement, training & health',
  },
  Reflection: {
    name: 'Reflection',
    color: '#ec4899',
    darkInk: '#f9a8d4',
    lightInk: '#be185d',
    description: 'Journaling, gratitude & review',
  },
  Other: {
    name: 'Other',
    color: '#3b82f6',
    darkInk: '#93c5fd',
    lightInk: '#1d4ed8',
    description: 'Routines & personal goals',
  },
}

export function getCategoryMeta(category?: string): CategoryMeta {
  if (category && category in CATEGORY_META) {
    return CATEGORY_META[category as HabitCategory]
  }
  return CATEGORY_META.Other
}

export type Habit = {
  id: string
  name: string
  category: HabitCategory
  streak: number
  streakFreeze: number
  frozenToday?: boolean
  completedToday: boolean
  history: boolean[] // last 7 days
  notes: string[]
  tags: string[]
  lastActiveDate: string // YYYY-MM-DD
  reminderTime?: string // 24h HH:mm or empty string
  color: string
}

export const HABIT_PALETTE = ['#a78bfa', '#34d399', '#f472b6', '#fbbf24', '#60a5fa', '#fb923c']

export function getTodayDateKey(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function diffCalendarDays(fromKey: string, toKey: string): number {
  if (!VALIDATION_LIMITS.DATE_KEY_PATTERN.test(fromKey) || !VALIDATION_LIMITS.DATE_KEY_PATTERN.test(toKey)) {
    return 0
  }
  const [fy, fm, fd] = fromKey.split('-').map(Number)
  const [ty, tm, td] = toKey.split('-').map(Number)
  const fromUtc = Date.UTC(fy, fm - 1, fd)
  const toUtc = Date.UTC(ty, tm - 1, td)
  return Math.round((toUtc - fromUtc) / 86_400_000)
}

export function rolloverHabitToToday(
  habit: Habit,
  todayKey: string = getTodayDateKey()
): { habit: Habit; changed: boolean } {
  const lastDate = VALIDATION_LIMITS.DATE_KEY_PATTERN.test(habit.lastActiveDate)
    ? habit.lastActiveDate
    : todayKey

  const delta = diffCalendarDays(lastDate, todayKey)
  if (delta <= 0) {
    if (habit.lastActiveDate === lastDate) {
      return { habit, changed: false }
    }
    return { habit: { ...habit, lastActiveDate: lastDate }, changed: true }
  }

  const shift = Math.min(VALIDATION_LIMITS.HISTORY_DAYS, delta)
  const nextHistory = [
    ...habit.history.slice(shift),
    ...Array.from({ length: shift }, () => false),
  ]

  const keptStreak = delta === 1 && (habit.completedToday || Boolean(habit.frozenToday))
  const nextStreak = keptStreak ? habit.streak : 0

  return {
    habit: {
      ...habit,
      completedToday: false,
      frozenToday: false,
      streak: nextStreak,
      history: nextHistory,
      lastActiveDate: todayKey,
    },
    changed: true,
  }
}

export function getDefaultHabits(todayKey: string = getTodayDateKey()): Habit[] {
  return [
    {
      id: '1',
      name: 'Morning meditation',
      category: 'Mindfulness',
      streak: 12,
      streakFreeze: 2,
      frozenToday: false,
      completedToday: false,
      history: [true, true, true, false, true, true, true],
      notes: ['10 min breath focus before coffee'],
      tags: ['morning', 'calm'],
      lastActiveDate: todayKey,
      color: '#a78bfa',
    },
    {
      id: '2',
      name: 'Deep work block',
      category: 'Focus',
      streak: 5,
      streakFreeze: 1,
      frozenToday: false,
      completedToday: true,
      history: [true, true, false, true, true, true, true],
      notes: [],
      tags: ['morning', 'deep-work'],
      lastActiveDate: todayKey,
      color: '#34d399',
    },
    {
      id: '3',
      name: 'Evening journal',
      category: 'Reflection',
      streak: 21,
      streakFreeze: 2,
      frozenToday: false,
      completedToday: false,
      history: [true, true, true, true, true, true, false],
      notes: [],
      tags: ['evening', 'clarity'],
      lastActiveDate: todayKey,
      color: '#f472b6',
    },
    {
      id: '4',
      name: 'Move / train',
      category: 'Fitness',
      streak: 8,
      streakFreeze: 1,
      frozenToday: false,
      completedToday: false,
      history: [true, false, true, true, true, true, true],
      notes: [],
      tags: ['energy', 'health'],
      lastActiveDate: todayKey,
      color: '#fbbf24',
    },
  ]
}

const DEFAULT_CATEGORY_BY_ID: Record<string, HabitCategory> = {
  '1': 'Mindfulness',
  '2': 'Focus',
  '3': 'Reflection',
  '4': 'Fitness',
}

export function normalizeTag(raw: string): string {
  return raw
    .trim()
    .replace(/^#+/, '')
    .replace(/\s+/g, ' ')
    .slice(0, VALIDATION_LIMITS.MAX_TAG_LENGTH)
    .trim()
}

export function sanitizeTags(rawTags: unknown): string[] {
  if (!Array.isArray(rawTags)) return []
  const seen = new Set<string>()
  const result: string[] = []
  for (const item of rawTags) {
    if (typeof item !== 'string') continue
    const normalized = normalizeTag(item)
    if (!normalized) continue
    const key = normalized.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(normalized)
    if (result.length >= VALIDATION_LIMITS.MAX_TAGS_COUNT) break
  }
  return result
}

export function normalizeReminderTime(raw: unknown): string {
  if (typeof raw !== 'string') return ''
  const trimmed = raw.trim()
  if (!trimmed) return ''
  return VALIDATION_LIMITS.REMINDER_TIME_PATTERN.test(trimmed) ? trimmed : ''
}

export function formatReminderTime(time24?: string): string {
  const normalized = normalizeReminderTime(time24)
  if (!normalized) return ''
  const [hhStr, mmStr] = normalized.split(':')
  const hh = Number(hhStr)
  const period = hh >= 12 ? 'PM' : 'AM'
  const hour12 = hh % 12 === 0 ? 12 : hh % 12
  return `${hour12}:${mmStr} ${period}`
}

export function sanitizeHabit(
  raw: Partial<Habit> & { id: string; name: string },
  index = 0,
  todayKey: string = getTodayDateKey()
): Habit {
  const safeId =
    typeof raw.id === 'string' &&
    raw.id.length >= 1 &&
    raw.id.length <= 128 &&
    VALIDATION_LIMITS.OWNER_ID_PATTERN.test(raw.id)
      ? raw.id
      : crypto.randomUUID()

  const safeName =
    (raw.name || 'Untitled habit')
      .trim()
      .slice(0, VALIDATION_LIMITS.MAX_HABIT_NAME_LENGTH) || 'Untitled habit'

  const safeCategory: HabitCategory =
    raw.category && HABIT_CATEGORIES.includes(raw.category as HabitCategory)
      ? (raw.category as HabitCategory)
      : DEFAULT_CATEGORY_BY_ID[safeId] ?? 'Other'

  const safeStreak =
    typeof raw.streak === 'number' && Number.isFinite(raw.streak)
      ? Math.min(10000, Math.max(0, Math.round(raw.streak)))
      : 0

  const safeFreeze =
    typeof raw.streakFreeze === 'number' && Number.isFinite(raw.streakFreeze)
      ? Math.min(10, Math.max(0, Math.round(raw.streakFreeze)))
      : 1

  const safeHistory =
    Array.isArray(raw.history) && raw.history.length === VALIDATION_LIMITS.HISTORY_DAYS
      ? raw.history.map(Boolean)
      : [false, false, false, false, false, false, false]

  const safeNotes = Array.isArray(raw.notes)
    ? raw.notes
        .filter((n): n is string => typeof n === 'string')
        .map(n => n.trim().slice(0, VALIDATION_LIMITS.MAX_NOTE_LENGTH))
        .filter(n => n.length > 0)
        .slice(0, VALIDATION_LIMITS.MAX_NOTES_COUNT)
    : []

  const safeTags = sanitizeTags(raw.tags)

  const safeDate =
    typeof raw.lastActiveDate === 'string' && VALIDATION_LIMITS.DATE_KEY_PATTERN.test(raw.lastActiveDate)
      ? raw.lastActiveDate
      : todayKey

  const safeReminderTime = normalizeReminderTime(raw.reminderTime)

  const safeColor =
    typeof raw.color === 'string' && VALIDATION_LIMITS.HEX_COLOR_PATTERN.test(raw.color)
      ? raw.color
      : HABIT_PALETTE[index % HABIT_PALETTE.length]

  return {
    id: safeId,
    name: safeName,
    category: safeCategory,
    streak: safeStreak,
    streakFreeze: safeFreeze,
    frozenToday: Boolean(raw.frozenToday),
    completedToday: Boolean(raw.completedToday),
    history: safeHistory,
    notes: safeNotes,
    tags: safeTags,
    lastActiveDate: safeDate,
    reminderTime: safeReminderTime,
    color: safeColor,
  }
}

export function loadLocalHabits(): Habit[] {
  const todayKey = getTodayDateKey()
  try {
    const raw = localStorage.getItem('moxie-habits')
    if (raw) {
      const parsed = JSON.parse(raw) as Array<Partial<Habit> & { id: string; name: string }>
      if (Array.isArray(parsed) && parsed.length > 0) {
        let anyChanged = false
        const rolled = parsed.map((h, i) => {
          const sanitized = sanitizeHabit(h, i, todayKey)
          const res = rolloverHabitToToday(sanitized, todayKey)
          if (res.changed) anyChanged = true
          return res.habit
        })
        if (anyChanged) {
          saveLocalHabits(rolled)
        }
        return rolled
      }
    }
  } catch {
    // ignore corrupted local storage
  }
  return getDefaultHabits(todayKey)
}

export function saveLocalHabits(habits: Habit[]) {
  try {
    localStorage.setItem('moxie-habits', JSON.stringify(habits))
  } catch {
    // ignore storage quota failures
  }
}
