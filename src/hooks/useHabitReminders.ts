import { useCallback, useEffect, useState } from 'react'
import { formatReminderTime, getTodayDateKey, normalizeReminderTime, type Habit } from '../lib/habits'

export type NotificationPermissionState = NotificationPermission | 'unsupported'

export interface ReminderAlert {
  key: string
  habitId: string
  habitName: string
  category: string
  color: string
  streak: number
  reminderLabel: string
  isTest?: boolean
}

const FIRED_STORAGE_KEY = 'maloxie-fired-reminders'

function getNotificationPermission(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported'
  }
  return Notification.permission
}

function loadFiredKeys(todayKey: string): Set<string> {
  try {
    const raw = localStorage.getItem(FIRED_STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set()
    const prefix = `${todayKey}|`
    return new Set(parsed.filter((item): item is string => typeof item === 'string' && item.startsWith(prefix)))
  } catch {
    return new Set()
  }
}

function saveFiredKeys(keys: Set<string>, todayKey: string) {
  try {
    const prefix = `${todayKey}|`
    const filtered = Array.from(keys).filter(k => k.startsWith(prefix)).slice(-200)
    localStorage.setItem(FIRED_STORAGE_KEY, JSON.stringify(filtered))
  } catch {
    // ignore storage quota failures
  }
}

function toMinutesOfDay(hhmm: string): number {
  const [hh, mm] = hhmm.split(':').map(Number)
  return hh * 60 + mm
}

function dispatchBrowserNotification(title: string, body: string, tag: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  try {
    const notification = new Notification(title, {
      body,
      icon: '/maloxie-logo.png',
      badge: '/maloxie-logo.png',
      tag,
    })
    notification.onclick = () => {
      window.focus()
      notification.close()
    }
  } catch {
    // Some embedded contexts restrict Notification constructor; in-app toast remains active
  }
}

export function useHabitReminders(habits: Habit[]) {
  const [permission, setPermission] = useState<NotificationPermissionState>(() => getNotificationPermission())
  const [alerts, setAlerts] = useState<ReminderAlert[]>([])

  const syncPermission = useCallback(() => {
    setPermission(getNotificationPermission())
  }, [])

  const requestPermission = useCallback(async (): Promise<NotificationPermissionState> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported')
      return 'unsupported'
    }
    if (Notification.permission !== 'default') {
      setPermission(Notification.permission)
      return Notification.permission
    }
    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result
    } catch {
      const current = getNotificationPermission()
      setPermission(current)
      return current
    }
  }, [])

  const dismissAlert = useCallback((key: string) => {
    setAlerts(prev => prev.filter(a => a.key !== key))
  }, [])

  const sendTestNotification = useCallback(async () => {
    const perm = permission === 'default' ? await requestPermission() : permission
    const sample = habits.find(h => Boolean(normalizeReminderTime(h.reminderTime))) ?? habits[0]
    const habitName = sample?.name ?? 'Daily habit'
    const category = sample?.category ?? 'Focus'
    const streak = sample?.streak ?? 0
    const timeLabel = formatReminderTime(sample?.reminderTime) || 'Now'

    if (perm === 'granted') {
      dispatchBrowserNotification(
        `Reminder preview: ${habitName}`,
        `${category} · Local browser reminders are working.`,
        `maloxie-test-${Date.now()}`
      )
    }

    const alertKey = `test|${Date.now()}`
    setAlerts(prev => [
      ...prev.slice(-3),
      {
        key: alertKey,
        habitId: sample?.id ?? '',
        habitName,
        category,
        color: sample?.color ?? '#a78bfa',
        streak,
        reminderLabel: timeLabel,
        isTest: true,
      },
    ])
  }, [habits, permission, requestPermission])

  // Auto-dismiss alerts for habits completed or frozen after the alert fired
  useEffect(() => {
    setAlerts(prev =>
      prev.filter(alert => {
        if (alert.isTest || !alert.habitId) return true
        const habit = habits.find(h => h.id === alert.habitId)
        return Boolean(habit && !habit.completedToday && !habit.frozenToday)
      })
    )
  }, [habits])

  // Poll every 10s & on tab focus to fire due local reminders
  useEffect(() => {
    const checkReminders = () => {
      syncPermission()
      const now = new Date()
      const todayKey = getTodayDateKey(now)
      const nowMinutes = now.getHours() * 60 + now.getMinutes()
      const fired = loadFiredKeys(todayKey)
      let firedChanged = false
      const newlyDue: ReminderAlert[] = []

      for (const habit of habits) {
        if (habit.completedToday || habit.frozenToday) continue
        const time24 = normalizeReminderTime(habit.reminderTime)
        if (!time24) continue

        const targetMinutes = toMinutesOfDay(time24)
        const delta = nowMinutes - targetMinutes
        if (delta < 0 || delta > 1) continue

        const key = `${todayKey}|${habit.id}|${time24}`
        if (fired.has(key)) continue

        fired.add(key)
        firedChanged = true

        const reminderLabel = formatReminderTime(time24)
        const streakCopy =
          habit.streak > 0 ? `${habit.streak}-day streak · Scheduled for ${reminderLabel}` : `Scheduled for ${reminderLabel}`

        dispatchBrowserNotification(
          `Time for ${habit.name}`,
          `${habit.category} · ${streakCopy}`,
          `maloxie-${habit.id}-${todayKey}`
        )

        newlyDue.push({
          key,
          habitId: habit.id,
          habitName: habit.name,
          category: habit.category,
          color: habit.color,
          streak: habit.streak,
          reminderLabel,
        })
      }

      if (firedChanged) {
        saveFiredKeys(fired, todayKey)
      }

      if (newlyDue.length > 0) {
        setAlerts(prev => {
          const existingKeys = new Set(prev.map(a => a.key))
          const additions = newlyDue.filter(a => !existingKeys.has(a.key))
          return additions.length > 0 ? [...prev, ...additions].slice(-4) : prev
        })
      }
    }

    checkReminders()
    const interval = window.setInterval(checkReminders, 10_000)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkReminders()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [habits, syncPermission])

  return {
    permission,
    alerts,
    requestPermission,
    dismissAlert,
    sendTestNotification,
  }
}
