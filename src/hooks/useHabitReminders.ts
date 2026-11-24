import { useCallback, useEffect, useRef, useState } from 'react'
import { formatReminderTime, getTodayDateKey, normalizeReminderTime, type Habit } from '../lib/habits'
import {
  clearPendingCompletion,
  getFiredReminderKeys,
  getPendingCompletions,
  saveFiredReminderKeys,
  saveStoredReminders,
} from '../lib/reminderDb'

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

function loadLocalFiredKeys(todayKey: string): Set<string> {
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

function saveLocalFiredKeys(keys: Set<string>, todayKey: string) {
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

async function dispatchServiceWorkerNotification(
  title: string,
  body: string,
  tag: string,
  habitId: string,
  dateKey: string
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  if (Notification.permission !== 'granted') return false

  try {
    if ('serviceWorker' in navigator) {
      const registration = await Promise.race<ServiceWorkerRegistration | null>([
        navigator.serviceWorker.ready,
        new Promise<null>(resolve => setTimeout(() => resolve(null), 800)),
      ])
      if (registration && typeof registration.showNotification === 'function') {
        const options: NotificationOptions & {
          actions?: Array<{ action: string; title: string }>
        } = {
          body,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag,
          data: { habitId, dateKey, url: '/' },
          actions: habitId
            ? [
                { action: 'mark-done', title: 'Mark done' },
                { action: 'open', title: 'Open app' },
              ]
            : [{ action: 'open', title: 'Open app' }],
        }
        await registration.showNotification(title, options)
        return true
      }
    }
  } catch {
    // Fallback to window Notification constructor below
  }

  try {
    const notification = new Notification(title, {
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag,
    })
    notification.onclick = () => {
      window.focus()
      notification.close()
    }
    return true
  } catch {
    return false
  }
}

export function useHabitReminders(
  habits: Habit[],
  onMarkHabitDone?: (habitId: string) => void | Promise<void>
) {
  const [permission, setPermission] = useState<NotificationPermissionState>(() => getNotificationPermission())
  const [alerts, setAlerts] = useState<ReminderAlert[]>([])
  const [swReady, setSwReady] = useState(false)
  const [backgroundSyncActive, setBackgroundSyncActive] = useState(false)
  const onMarkDoneRef = useRef(onMarkHabitDone)
  onMarkDoneRef.current = onMarkHabitDone

  const syncPermission = useCallback(() => {
    setPermission(getNotificationPermission())
  }, [])

  const registerBackgroundSync = useCallback(async () => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
    try {
      const registration = await navigator.serviceWorker.ready
      setSwReady(true)

      const periodicSync = (
        registration as ServiceWorkerRegistration & {
          periodicSync?: {
            register: (tag: string, options?: { minInterval: number }) => Promise<void>
          }
        }
      ).periodicSync

      if (periodicSync && Notification.permission === 'granted') {
        await periodicSync.register('maloxie-habit-reminders', {
          minInterval: 15 * 60 * 1000,
        })
        setBackgroundSyncActive(true)
      }
    } catch {
      // Periodic Background Sync is optional and only enabled on supported installed PWAs
      setBackgroundSyncActive(false)
    }
  }, [])

  const requestPermission = useCallback(async (): Promise<NotificationPermissionState> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported')
      return 'unsupported'
    }
    if (Notification.permission !== 'default') {
      setPermission(Notification.permission)
      if (Notification.permission === 'granted') {
        void registerBackgroundSync()
      }
      return Notification.permission
    }
    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      if (result === 'granted') {
        void registerBackgroundSync()
      }
      return result
    } catch {
      const current = getNotificationPermission()
      setPermission(current)
      return current
    }
  }, [registerBackgroundSync])

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
    const todayKey = getTodayDateKey()

    if (perm === 'granted') {
      await dispatchServiceWorkerNotification(
        `Reminder preview: ${habitName}`,
        `${category} · PWA background notifications are active.`,
        `maloxie-test-${Date.now()}`,
        sample?.id ?? '',
        todayKey
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

  // Sync habit reminders into IndexedDB for the Service Worker & register Periodic Sync
  useEffect(() => {
    const payload = habits
      .map(h => ({
        id: h.id,
        name: h.name,
        category: h.category,
        streak: h.streak,
        reminderTime: normalizeReminderTime(h.reminderTime),
        completedToday: h.completedToday,
        frozenToday: Boolean(h.frozenToday),
        lastActiveDate: h.lastActiveDate,
        color: h.color,
      }))
      .filter(h => Boolean(h.reminderTime))

    void saveStoredReminders(payload)
    if (permission === 'granted' && payload.length > 0) {
      void registerBackgroundSync()
    }
  }, [habits, permission, registerBackgroundSync])

  // Handle "Mark done" action clicked on an OS Service Worker notification
  useEffect(() => {
    const drainPending = async () => {
      const todayKey = getTodayDateKey()
      const pending = await getPendingCompletions()
      for (const item of pending) {
        if (item.dateKey === todayKey) {
          const target = habits.find(h => h.id === item.habitId)
          if (target && !target.completedToday) {
            await onMarkDoneRef.current?.(item.habitId)
          }
        }
        await clearPendingCompletion(item.habitId, item.dateKey)
      }
    }

    void drainPending()

    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return

    const handleSwMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; habitId?: string; dateKey?: string } | undefined
      if (data?.type === 'MARK_HABIT_DONE' && data.habitId) {
        const habitId = data.habitId
        const dateKey = data.dateKey || getTodayDateKey()
        const target = habits.find(h => h.id === habitId)
        if (target && !target.completedToday) {
          void onMarkDoneRef.current?.(habitId)
        }
        void clearPendingCompletion(habitId, dateKey)
      }
    }

    navigator.serviceWorker.addEventListener('message', handleSwMessage)
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleSwMessage)
    }
  }, [habits])

  // Check SW readiness on mount
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
    let active = true
    void navigator.serviceWorker.ready
      .then(() => {
        if (active) setSwReady(true)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

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

  // Poll every 10s & on tab focus to fire due reminders via Service Worker (or in-app fallback)
  useEffect(() => {
    let checking = false

    const checkReminders = async () => {
      if (checking) return
      checking = true
      try {
        syncPermission()
        const now = new Date()
        const todayKey = getTodayDateKey(now)
        const nowMinutes = now.getHours() * 60 + now.getMinutes()
        const localFired = loadLocalFiredKeys(todayKey)
        const idbFired = await getFiredReminderKeys(todayKey)
        const fired = new Set([...localFired, ...idbFired])
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
            habit.streak > 0
              ? `${habit.streak}-day streak · Scheduled for ${reminderLabel}`
              : `Scheduled for ${reminderLabel}`

          await dispatchServiceWorkerNotification(
            `Time for ${habit.name}`,
            `${habit.category} · ${streakCopy}`,
            `maloxie-${habit.id}-${todayKey}`,
            habit.id,
            todayKey
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
          saveLocalFiredKeys(fired, todayKey)
          await saveFiredReminderKeys(todayKey, Array.from(fired))
        }

        if (newlyDue.length > 0) {
          setAlerts(prev => {
            const existingKeys = new Set(prev.map(a => a.key))
            const additions = newlyDue.filter(a => !existingKeys.has(a.key))
            return additions.length > 0 ? [...prev, ...additions].slice(-4) : prev
          })
        }
      } finally {
        checking = false
      }
    }

    void checkReminders()
    const interval = window.setInterval(() => {
      void checkReminders()
    }, 10_000)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void checkReminders()
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
    swReady,
    backgroundSyncActive,
    requestPermission,
    dismissAlert,
    sendTestNotification,
  }
}
