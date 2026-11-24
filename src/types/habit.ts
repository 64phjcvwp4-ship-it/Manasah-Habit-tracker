export const HABIT_CATEGORIES = [
  'Mindfulness',
  'Focus',
  'Fitness',
  'Reflection',
  'Health',
  'Learning',
  'Other',
] as const

export type HabitCategory = (typeof HABIT_CATEGORIES)[number]

export type HabitType = 'boolean' | 'numeric' | 'timed'

export type HabitFrequency =
  | { type: 'daily' }
  | { type: 'weekdays'; days: number[] } // 0 = Sun .. 6 = Sat
  | { type: 'times_per_week'; target: number }
  | { type: 'times_per_month'; target: number }

export type HabitIconName =
  | 'Flame'
  | 'Brain'
  | 'Dumbbell'
  | 'BookOpen'
  | 'Droplets'
  | 'Moon'
  | 'Sparkles'
  | 'Code'
  | 'Heart'
  | 'Sun'
  | 'Timer'
  | 'Target'

export type Habit = {
  id: string
  name: string
  category: HabitCategory
  tags: string[]
  color: string
  icon: HabitIconName
  habitType: HabitType
  targetValue: number // 1 for boolean, e.g. 8 for numeric, e.g. 30 for timed (minutes)
  unit: string // '', 'glasses', 'min', etc.
  frequency: HabitFrequency
  description: string
  whyNote: string
  startDate: string // YYYY-MM-DD
  endDate?: string // YYYY-MM-DD
  paused: boolean
  archived: boolean
  logs: Record<string, number> // YYYY-MM-DD -> logged numeric/minutes/1 value
  frozenDates: string[] // YYYY-MM-DD dates protected by a streak freeze token
  longestStreak: number
}

export type HabitTemplate = {
  id: string
  name: string
  category: HabitCategory
  tags: string[]
  color: string
  icon: HabitIconName
  habitType: HabitType
  targetValue: number
  unit: string
  frequency: HabitFrequency
  description: string
  whyNote: string
}

export type Challenge = {
  id: string
  title: string
  description: string
  durationDays: number
  category: HabitCategory
  color: string
  xpReward: number
  joined: boolean
  startDate?: string
  completedDates: string[]
}

export type WeeklyReflection = {
  id: string
  weekKey: string
  prompt: string
  response: string
  updatedAt: string
}

export type BadgeDef = {
  id: string
  title: string
  description: string
  icon: 'Flame' | 'Trophy' | 'Sparkles' | 'Target' | 'Shield' | 'Award' | 'Zap' | 'Star'
  color: string
}

export const HABIT_COLORS = [
  '#a78bfa',
  '#34d399',
  '#f472b6',
  '#fbbf24',
  '#60a5fa',
  '#fb923c',
  '#2dd4bf',
  '#f87171',
]

export const HABIT_ICONS: HabitIconName[] = [
  'Sparkles',
  'Brain',
  'Dumbbell',
  'BookOpen',
  'Droplets',
  'Moon',
  'Flame',
  'Code',
  'Heart',
  'Sun',
  'Timer',
  'Target',
]

export const HABIT_TEMPLATES: HabitTemplate[] = [
  {
    id: 'tpl-exercise',
    name: 'Morning movement',
    category: 'Fitness',
    tags: ['health', 'energy'],
    color: '#fbbf24',
    icon: 'Dumbbell',
    habitType: 'timed',
    targetValue: 30,
    unit: 'min',
    frequency: { type: 'weekdays', days: [1, 2, 3, 4, 5] },
    description: '30 minutes of strength, running, or mobility training.',
    whyNote: 'Builds physical resilience and clears mental fog before work.',
  },
  {
    id: 'tpl-water',
    name: 'Hydrate 8 glasses',
    category: 'Health',
    tags: ['hydration', 'daily'],
    color: '#60a5fa',
    icon: 'Droplets',
    habitType: 'numeric',
    targetValue: 8,
    unit: 'glasses',
    frequency: { type: 'daily' },
    description: 'Drink 8 full glasses of water throughout the day.',
    whyNote: 'Sustains focus, mood, and steady energy without caffeine crashes.',
  },
  {
    id: 'tpl-study',
    name: 'Focused study block',
    category: 'Learning',
    tags: ['study', 'skill'],
    color: '#a78bfa',
    icon: 'BookOpen',
    habitType: 'timed',
    targetValue: 45,
    unit: 'min',
    frequency: { type: 'times_per_week', target: 5 },
    description: 'Distraction-free reading, practice, or coursework.',
    whyNote: 'Compounds expertise 45 minutes at a time.',
  },
  {
    id: 'tpl-sleep',
    name: '8h Sleep wind-down',
    category: 'Health',
    tags: ['sleep', 'recovery'],
    color: '#2dd4bf',
    icon: 'Moon',
    habitType: 'boolean',
    targetValue: 1,
    unit: '',
    frequency: { type: 'daily' },
    description: 'Screens off 45 minutes before bed and lights out on time.',
    whyNote: 'Quality sleep is the multiplier for every other habit.',
  },
  {
    id: 'tpl-meditate',
    name: 'Breathwork & mindfulness',
    category: 'Mindfulness',
    tags: ['calm', 'morning'],
    color: '#c4b5fd',
    icon: 'Brain',
    habitType: 'timed',
    targetValue: 10,
    unit: 'min',
    frequency: { type: 'daily' },
    description: '10 minutes of quiet breathing and awareness.',
    whyNote: 'Creates space between stimulus and reaction.',
  },
  {
    id: 'tpl-journal',
    name: 'Evening reflection',
    category: 'Reflection',
    tags: ['clarity', 'evening'],
    color: '#f472b6',
    icon: 'Sparkles',
    habitType: 'boolean',
    targetValue: 1,
    unit: '',
    frequency: { type: 'daily' },
    description: 'Write 3 wins and 1 priority for tomorrow.',
    whyNote: 'Closes the day with gratitude and sharpens tomorrow.',
  },
]

export const DEFAULT_CHALLENGES: Challenge[] = [
  {
    id: 'ch-30-focus',
    title: '30-Day Deep Focus Challenge',
    description: 'Log at least one distraction-free focus session every day for 30 days.',
    durationDays: 30,
    category: 'Focus',
    color: '#a78bfa',
    xpReward: 400,
    joined: false,
    completedDates: [],
  },
  {
    id: 'ch-no-sugar',
    title: 'No-Sugar Month',
    description: 'Skip added sugars and sugary drinks for 30 consecutive days.',
    durationDays: 30,
    category: 'Health',
    color: '#34d399',
    xpReward: 450,
    joined: false,
    completedDates: [],
  },
  {
    id: 'ch-21-early',
    title: '21-Day Sunrise Routine',
    description: 'Start your morning before 7:30 AM without scrolling for 21 days.',
    durationDays: 21,
    category: 'Mindfulness',
    color: '#fbbf24',
    xpReward: 300,
    joined: false,
    completedDates: [],
  },
]

export const BADGE_DEFS: BadgeDef[] = [
  { id: 'first-checkin', title: 'First Spark', description: 'Complete your first habit check-in', icon: 'Sparkles', color: '#a78bfa' },
  { id: 'streak-7', title: '7-Day Streak', description: 'Reach a 7-day streak on any habit', icon: 'Flame', color: '#fbbf24' },
  { id: 'streak-30', title: '30-Day Legend', description: 'Reach a 30-day streak on any habit', icon: 'Trophy', color: '#f472b6' },
  { id: 'checkins-100', title: '100 Check-Ins', description: 'Log 100 total completed habit days', icon: 'Award', color: '#34d399' },
  { id: 'perfect-day', title: 'Clean Sweep', description: 'Complete every active habit in a day', icon: 'Target', color: '#60a5fa' },
  { id: 'architect-5', title: 'Habit Architect', description: 'Track 5 or more active habits', icon: 'Zap', color: '#fb923c' },
  { id: 'freeze-master', title: 'Protected Chain', description: 'Use a streak freeze token wisely', icon: 'Shield', color: '#2dd4bf' },
  { id: 'challenge-hero', title: 'Challenger', description: 'Join and check in on a challenge', icon: 'Star', color: '#c4b5fd' },
]

export const DAILY_QUOTES: { text: string; author: string }[] = [
  { text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.', author: 'Will Durant' },
  { text: 'Small habits compound faster than dramatic bursts of effort.', author: 'Moxie' },
  { text: 'You do not rise to the level of your goals. You fall to the level of your systems.', author: 'James Clear' },
  { text: 'Missing once is an accident. Missing twice is the start of a new habit.', author: 'James Clear' },
  { text: 'Discipline is choosing between what you want now and what you want most.', author: 'Abraham Lincoln' },
  { text: 'Consistency turns ordinary days into extraordinary outcomes.', author: 'Moxie' },
  { text: 'Make the good habit obvious, attractive, and small enough to start today.', author: 'Moxie' },
]

export const REFLECTION_PROMPTS: string[] = [
  'What habit felt effortless this week, and what made it easy?',
  'Where did friction show up this week, and how can you shrink the first step?',
  'Which habit gave you the biggest boost in energy or clarity?',
  'What is one small win from the last 7 days worth celebrating?',
]

// Date helpers
export function toDateKey(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDays(dateKey: string, delta: number): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + delta)
  return toDateKey(dt)
}

export function getLastNDates(n: number, endKey: string = toDateKey()): string[] {
  return Array.from({ length: n }, (_, i) => addDays(endKey, -(n - 1 - i)))
}

export function isHabitCompletedOn(habit: Habit, dateKey: string): boolean {
  const val = habit.logs[dateKey] ?? 0
  return val >= (habit.habitType === 'boolean' ? 1 : Math.max(1, habit.targetValue))
}

export function isHabitScheduledOn(habit: Habit, dateKey: string): boolean {
  if (habit.archived || habit.paused) return false
  if (habit.startDate && dateKey < habit.startDate) return false
  if (habit.endDate && dateKey > habit.endDate) return false
  if (habit.frequency.type === 'weekdays') {
    const [y, m, d] = dateKey.split('-').map(Number)
    const dow = new Date(y, m - 1, d).getDay()
    return habit.frequency.days.includes(dow)
  }
  return true
}

export function formatFrequency(freq: HabitFrequency): string {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  switch (freq.type) {
    case 'daily':
      return 'Daily'
    case 'weekdays':
      if (freq.days.length === 0) return 'Custom days'
      return freq.days.map(d => dayNames[d]).join(', ')
    case 'times_per_week':
      return `${freq.target}x / week`
    case 'times_per_month':
      return `${freq.target}x / month`
  }
}

export function computeCurrentStreak(habit: Habit, todayKey: string = toDateKey(), vacationMode = false): number {
  const frozenSet = new Set(habit.frozenDates)
  let streak = 0
  // Check up to 365 days backward; today is counted if done, otherwise start from yesterday if today isn't missed yet
  const doneToday = isHabitCompletedOn(habit, todayKey) || frozenSet.has(todayKey)
  const startOffset = doneToday ? 0 : 1

  for (let i = startOffset; i < 365; i++) {
    const key = addDays(todayKey, -i)
    if (habit.startDate && key < habit.startDate) break
    const completed = isHabitCompletedOn(habit, key)
    const frozen = frozenSet.has(key)

    if (completed) {
      streak += 1
      continue
    }
    if (frozen || habit.paused || vacationMode) {
      // Preserves streak without adding an extra completed day
      continue
    }
    if (habit.frequency.type === 'weekdays') {
      const [y, m, d] = key.split('-').map(Number)
      const dow = new Date(y, m - 1, d).getDay()
      if (!habit.frequency.days.includes(dow)) continue
    }
    break
  }
  return streak
}

export function computeLongestStreak(habit: Habit, todayKey: string = toDateKey(), vacationMode = false): number {
  const current = computeCurrentStreak(habit, todayKey, vacationMode)
  const frozenSet = new Set(habit.frozenDates)
  const keys = Object.keys(habit.logs).sort()
  if (keys.length === 0) return Math.max(habit.longestStreak, current)

  let best = Math.max(habit.longestStreak, current)
  let run = 0
  const first = keys[0]
  for (let i = 0; i < 365; i++) {
    const k = addDays(first, i)
    if (k > todayKey) break
    if (isHabitCompletedOn(habit, k)) {
      run += 1
      if (run > best) best = run
    } else if (frozenSet.has(k)) {
      continue
    } else if (habit.frequency.type === 'weekdays') {
      const [y, m, d] = k.split('-').map(Number)
      const dow = new Date(y, m - 1, d).getDay()
      if (habit.frequency.days.includes(dow)) run = 0
    } else {
      run = 0
    }
  }
  return best
}

export function getLast7History(habit: Habit, todayKey: string = toDateKey()): boolean[] {
  return getLastNDates(7, todayKey).map(d => isHabitCompletedOn(habit, d))
}

export function computeCompletionRate(habits: Habit[], days: number, todayKey: string = toDateKey()): number {
  const active = habits.filter(h => !h.archived && !h.paused)
  if (active.length === 0) return 0
  const dateKeys = getLastNDates(days, todayKey)
  let completedSlots = 0
  let totalSlots = 0

  for (const h of active) {
    if (days > 1 && h.frequency.type === 'times_per_week') {
      const weeks = Math.max(1, days / 7)
      const target = Math.round(h.frequency.target * weeks)
      const done = dateKeys.filter(k => isHabitCompletedOn(h, k)).length
      completedSlots += Math.min(done, target)
      totalSlots += target
      continue
    }
    if (days > 7 && h.frequency.type === 'times_per_month') {
      const target = h.frequency.target
      const done = dateKeys.filter(k => isHabitCompletedOn(h, k)).length
      completedSlots += Math.min(done, target)
      totalSlots += target
      continue
    }
    for (const k of dateKeys) {
      if (!isHabitScheduledOn(h, k)) continue
      totalSlots += 1
      if (isHabitCompletedOn(h, k)) completedSlots += 1
    }
  }
  if (totalSlots === 0) return 0
  return Math.round((completedSlots / totalSlots) * 100)
}

export function getLevelInfo(xp: number) {
  const level = Math.floor(xp / 250) + 1
  const currentLevelXp = (level - 1) * 250
  const nextLevelXp = level * 250
  const progress = Math.round(((xp - currentLevelXp) / 250) * 100)
  const titles = ['Starter', 'Spark', 'Consistent', 'Builder', 'Architect', 'Trailblazer', 'Master', 'Legend']
  const title = titles[Math.min(level - 1, titles.length - 1)]
  return { level, xp, currentLevelXp, nextLevelXp, progress, title }
}
