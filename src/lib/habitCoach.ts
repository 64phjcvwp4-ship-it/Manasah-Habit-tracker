import { formatReminderTime, HABIT_CATEGORIES, normalizeReminderTime, type Habit } from './habits'

function pct(done: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((done / total) * 100)
}

function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralForm}`
}

function weeklyHits(h: Habit): number {
  return h.history.filter(Boolean).length
}

function describeHabitLine(h: Habit): string {
  const status = h.completedToday ? 'Done today' : h.frozenToday ? 'Frozen today' : 'Pending today'
  const reminder = formatReminderTime(h.reminderTime)
  const reminderNote = reminder ? ` · reminder ${reminder}` : ''
  return `${h.name} (${h.category}): ${status}, ${h.streak}d streak, ${weeklyHits(h)}/7 this week, ${plural(h.streakFreeze, 'freeze token')}${reminderNote}`
}

export function generateHabitCoachReply(rawMessage: string, habits: Habit[]): string {
  const query = rawMessage.trim()
  const q = query.toLowerCase()

  if (habits.length === 0) {
    return (
      "You haven't created any habits yet. Click \"Add habit\" above to start with 1–2 small daily rituals " +
      '(under 10 minutes), set a daily reminder time, and check them off to build your first streak.'
    )
  }

  const total = habits.length
  const completedToday = habits.filter(h => h.completedToday)
  const frozenToday = habits.filter(h => !h.completedToday && h.frozenToday)
  const pendingToday = habits.filter(h => !h.completedToday && !h.frozenToday)

  const weeklyDoneCount = habits.reduce((sum, h) => sum + weeklyHits(h), 0)
  const weeklyPossible = total * 7
  const weeklyRate = pct(weeklyDoneCount, weeklyPossible)

  const sortedByStreakDesc = [...habits].sort((a, b) => b.streak - a.streak || weeklyHits(b) - weeklyHits(a))
  const sortedByWeeklyAsc = [...habits].sort((a, b) => weeklyHits(a) - weeklyHits(b) || a.streak - b.streak)

  // 1. Check explicit #tag mention first (e.g. "#morning")
  const allTags = Array.from(new Set(habits.flatMap(h => h.tags ?? [])))
  const explicitHashTag = allTags.find(tag => q.includes(`#${tag.toLowerCase()}`))
  if (explicitHashTag) {
    const tagged = habits.filter(h => (h.tags ?? []).some(t => t.toLowerCase() === explicitHashTag.toLowerCase()))
    const doneCount = tagged.filter(h => h.completedToday).length
    return [
      `Tag #${explicitHashTag} (${doneCount}/${tagged.length} done today):`,
      ...tagged.map(h => `• ${describeHabitLine(h)}`),
    ].join('\n')
  }

  // 2. Check if the user asked about a specific habit by name
  const matchedHabit = habits.find(h => {
    const nameLower = h.name.toLowerCase()
    if (q.includes(nameLower)) return true
    const words = nameLower.split(/[\s/]+/).filter(w => w.length >= 4)
    return words.some(w => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(q))
  })

  if (matchedHabit) {
    const hits = weeklyHits(matchedHabit)
    const reminder = formatReminderTime(matchedHabit.reminderTime)
    const latestNote = matchedHabit.notes[matchedHabit.notes.length - 1]
    const parts: string[] = [
      describeHabitLine(matchedHabit) + '.',
      matchedHabit.completedToday
        ? `Great work checking this off today—your ${matchedHabit.streak}-day streak is locked in.`
        : matchedHabit.frozenToday
          ? 'Your streak is protected today by a freeze token.'
          : matchedHabit.streak > 0
            ? `It's still pending today—completing it protects your ${matchedHabit.streak}-day streak${matchedHabit.streakFreeze > 0 ? ` (you also have ${plural(matchedHabit.streakFreeze, 'freeze token')})` : ''}.`
            : `It's ready whenever you are today—one check-in starts a fresh streak.`,
    ]
    if (hits <= 3 && !reminder) {
      parts.push('Tip: set a daily reminder on this card to anchor it to a fixed time of day.')
    } else if (latestNote) {
      parts.push(`Latest log: "${latestNote}"`)
    }
    return parts.join('\n\n')
  }

  // 3. Check if the user mentioned a specific tag word without '#'
  const matchedTag = allTags.find(tag => {
    const t = tag.toLowerCase()
    return new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(q)
  })
  if (matchedTag) {
    const tagged = habits.filter(h => (h.tags ?? []).some(t => t.toLowerCase() === matchedTag.toLowerCase()))
    const doneCount = tagged.filter(h => h.completedToday).length
    return [
      `Tag #${matchedTag} (${doneCount}/${tagged.length} done today):`,
      ...tagged.map(h => `• ${describeHabitLine(h)}`),
    ].join('\n')
  }

  // 3. Check if the user mentioned a specific category
  const matchedCategory = HABIT_CATEGORIES.find(cat => q.includes(cat.toLowerCase()))
  if (matchedCategory) {
    const inCat = habits.filter(h => h.category === matchedCategory)
    if (inCat.length === 0) {
      return `You don't have any habits in ${matchedCategory} yet. You can add one or switch a habit's category using the pencil button.`
    }
    const doneCount = inCat.filter(h => h.completedToday).length
    return [
      `${matchedCategory} habits (${doneCount}/${inCat.length} done today):`,
      ...inCat.map(h => `• ${describeHabitLine(h)}`),
    ].join('\n')
  }

  // 4. Protect streaks / freeze tokens
  if (/streak|protect|freeze|token|save|risk/.test(q)) {
    const atRisk = pendingToday
      .filter(h => h.streak > 0)
      .sort((a, b) => b.streak - a.streak)
    const noTokenAtRisk = atRisk.filter(h => h.streakFreeze === 0)

    if (atRisk.length === 0) {
      return (
        `All active streaks are safe today (${completedToday.length} completed, ${frozenToday.length} frozen). ` +
        `Top streak: ${sortedByStreakDesc[0].name} at ${sortedByStreakDesc[0].streak} days.`
      )
    }

    const lines = atRisk.slice(0, 4).map(h => {
      const tokenNote =
        h.streakFreeze > 0
          ? `${plural(h.streakFreeze, 'freeze token')} available`
          : '0 freeze tokens left — must complete today'
      return `• ${h.name}: ${h.streak}-day streak (${tokenNote})`
    })

    return [
      `${plural(atRisk.length, 'streak')} still uncompleted today:`,
      ...lines,
      noTokenAtRisk.length > 0
        ? `Prioritize ${noTokenAtRisk[0].name} first since it has no backup freeze tokens.`
        : 'Knock out the top one now or tap "Use Token" if today is packed.',
    ].join('\n')
  }

  // 5. Where am I slipping? / Weakest habits
  if (/slip|struggl|miss|weak|low|hard|drop|consistent|improve/.test(q)) {
    const weakest = sortedByWeeklyAsc.slice(0, 3)
    const unscheduledWeak = weakest.filter(h => !normalizeReminderTime(h.reminderTime))
    return [
      `Weekly consistency is ${weeklyRate}% (${weeklyDoneCount}/${weeklyPossible} check-ins). Lowest 7-day scores:`,
      ...weakest.map(h => `• ${h.name}: ${weeklyHits(h)}/7 days this week (${h.streak}d current streak)`),
      unscheduledWeak.length > 0
        ? `Next step: click "Remind" on ${unscheduledWeak[0].name} to set a daily nudge, and log quick blockers in its notes.`
        : `Next step: shrink ${weakest[0].name} to a 2-minute version today so you keep momentum going.`,
    ].join('\n')
  }

  // 6. Reminders / Schedule
  if (/remind|alert|notif|time|schedul/.test(q)) {
    const withReminders = habits.filter(h => Boolean(normalizeReminderTime(h.reminderTime)))
    const withoutReminders = pendingToday.filter(h => !normalizeReminderTime(h.reminderTime))
    if (withReminders.length === 0) {
      return (
        'No daily reminders are set yet. Click "Remind" on any habit card to pick a time and enable local browser alerts.'
      )
    }
    return [
      `Daily reminders scheduled (${withReminders.length}/${total}):`,
      ...withReminders.map(
        h => `• ${h.name} at ${formatReminderTime(h.reminderTime)} (${h.completedToday ? 'done today' : 'pending'})`
      ),
      withoutReminders.length > 0
        ? `Unscheduled pending today: ${withoutReminders.map(h => h.name).join(', ')}.`
        : 'All pending habits have reminders scheduled.',
    ].join('\n')
  }

  // 7. Weekly Review / Progress
  if (/week|review|report|progress|summary|how am i|doing|stats/.test(q)) {
    const best = sortedByStreakDesc[0]
    const worst = sortedByWeeklyAsc[0]
    const categoryStats = HABIT_CATEGORIES.map(cat => {
      const list = habits.filter(h => h.category === cat)
      if (list.length === 0) return null
      const hits = list.reduce((s, h) => s + weeklyHits(h), 0)
      return `${cat}: ${pct(hits, list.length * 7)}%`
    }).filter(Boolean)

    return [
      `Weekly snapshot: ${weeklyRate}% (${weeklyDoneCount}/${weeklyPossible} check-ins) · Today: ${completedToday.length}/${total} done${frozenToday.length ? `, ${frozenToday.length} frozen` : ''}.`,
      `• Strongest streak: ${best.name} (${best.streak} days, ${weeklyHits(best)}/7 this week)`,
      `• Needs attention: ${worst.name} (${weeklyHits(worst)}/7 this week)`,
      categoryStats.length > 0 ? `• By category: ${categoryStats.join(' · ')}` : '',
      pendingToday.length > 0
        ? `Next up today: ${pendingToday.slice(0, 2).map(h => h.name).join(' and ')}.`
        : 'Clean sweep today — every habit is done or protected!',
    ]
      .filter(Boolean)
      .join('\n')
  }

  // 8. What to focus on today / default personalized coaching
  if (pendingToday.length === 0) {
    return (
      `You've handled every habit today (${completedToday.length} completed, ${frozenToday.length} frozen) and hold a ${weeklyRate}% weekly rate. ` +
      `Your longest active streak is ${sortedByStreakDesc[0].name} at ${sortedByStreakDesc[0].streak} days. Rest up or add a reflection note to capture what worked today.`
    )
  }

  const priorityList = [...pendingToday].sort(
    (a, b) => b.streak - a.streak || weeklyHits(a) - weeklyHits(b)
  )

  return [
    `Today's snapshot: ${completedToday.length}/${total} completed (${weeklyRate}% this week). Best next moves:`,
    ...priorityList.slice(0, 3).map((h, i) => {
      const reason = h.streak > 0 ? `protects ${h.streak}d streak` : `${weeklyHits(h)}/7 this week`
      return `${i + 1}. ${h.name} (${reason})`
    }),
    'Ask me about any habit by name, a #tag, "Review my week", or "Protect my streaks".',
  ].join('\n')
}
