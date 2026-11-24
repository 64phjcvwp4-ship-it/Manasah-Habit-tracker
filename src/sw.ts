/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import {
  addPendingCompletion,
  getFiredReminderKeys,
  getStoredReminders,
  saveFiredReminderKeys,
  saveStoredReminders,
} from './lib/reminderDb'

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>
}

interface PeriodicSyncEvent extends ExtendableEvent {
  readonly tag: string
}

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
)

registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'gstatic-fonts-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
)

function getTodayDateKey(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatReminderTime(time24: string): string {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time24)) return ''
  const [hhStr, mmStr] = time24.split(':')
  const hh = Number(hhStr)
  const period = hh >= 12 ? 'PM' : 'AM'
  const hour12 = hh % 12 === 0 ? 12 : hh % 12
  return `${hour12}:${mmStr} ${period}`
}

function toMinutesOfDay(hhmm: string): number {
  const [hh, mm] = hhmm.split(':').map(Number)
  return hh * 60 + mm
}

async function checkAndNotifyDueReminders(graceMinutes = 15): Promise<void> {
  const now = new Date()
  const todayKey = getTodayDateKey(now)
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const reminders = await getStoredReminders()
  if (reminders.length === 0) return

  const fired = new Set(await getFiredReminderKeys(todayKey))
  let firedChanged = false

  for (const habit of reminders) {
    // Only skip completed/frozen if stored state matches today's calendar day
    if (habit.lastActiveDate === todayKey && (habit.completedToday || habit.frozenToday)) {
      continue
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(habit.reminderTime)) continue

    const targetMinutes = toMinutesOfDay(habit.reminderTime)
    const delta = nowMinutes - targetMinutes
    if (delta < 0 || delta > graceMinutes) continue

    const dedupeKey = `${todayKey}|${habit.id}|${habit.reminderTime}`
    if (fired.has(dedupeKey)) continue

    fired.add(dedupeKey)
    firedChanged = true

    const reminderLabel = formatReminderTime(habit.reminderTime)
    const body =
      habit.streak > 0
        ? `${habit.category} · ${habit.streak}-day streak · Scheduled for ${reminderLabel}`
        : `${habit.category} · Scheduled for ${reminderLabel}`

    const options: NotificationOptions & {
      actions?: Array<{ action: string; title: string }>
    } = {
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: `maloxie-${habit.id}-${todayKey}`,
      data: {
        habitId: habit.id,
        dateKey: todayKey,
        url: '/',
      },
      actions: [
        { action: 'mark-done', title: 'Mark done' },
        { action: 'open', title: 'Open app' },
      ],
    }

    await self.registration.showNotification(`Time for ${habit.name}`, options)
  }

  if (firedChanged) {
    await saveFiredReminderKeys(todayKey, Array.from(fired))
  }
}

self.addEventListener('install', () => {
  void self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('periodicsync', (rawEvent: Event) => {
  const event = rawEvent as PeriodicSyncEvent
  if (event.tag === 'maloxie-habit-reminders') {
    event.waitUntil(checkAndNotifyDueReminders(15))
  }
})

self.addEventListener('message', event => {
  const payload = event.data as { type?: string } | undefined
  if (!payload) return
  if (payload.type === 'SKIP_WAITING') {
    void self.skipWaiting()
  } else if (payload.type === 'CHECK_DUE_REMINDERS') {
    event.waitUntil(checkAndNotifyDueReminders(1))
  }
})

self.addEventListener('push', event => {
  let title = 'Maloxie Habit Reminder'
  let body = 'Time to check in on your daily habits.'
  let habitId = ''

  if (event.data) {
    try {
      const json = event.data.json() as { title?: string; body?: string; habitId?: string }
      if (json.title) title = json.title
      if (json.body) body = json.body
      if (json.habitId) habitId = json.habitId
    } catch {
      const text = event.data.text()
      if (text) body = text
    }
  }

  const todayKey = getTodayDateKey()
  const options: NotificationOptions & {
    actions?: Array<{ action: string; title: string }>
  } = {
    body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: habitId ? `maloxie-${habitId}-${todayKey}` : 'maloxie-push',
    data: { habitId, dateKey: todayKey, url: '/' },
    actions: habitId ? [{ action: 'mark-done', title: 'Mark done' }] : undefined,
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const data = (event.notification.data ?? {}) as {
    habitId?: string
    dateKey?: string
    url?: string
  }

  if (event.action === 'mark-done' && data.habitId) {
    const habitId = data.habitId
    const dateKey = data.dateKey || getTodayDateKey()

    event.waitUntil(
      (async () => {
        await addPendingCompletion({ habitId, dateKey })
        const stored = await getStoredReminders()
        const updated = stored.map(item =>
          item.id === habitId
            ? { ...item, completedToday: true, lastActiveDate: dateKey }
            : item
        )
        await saveStoredReminders(updated)

        const windowClients = await self.clients.matchAll({
          type: 'window',
          includeUncontrolled: true,
        })
        for (const client of windowClients) {
          client.postMessage({
            type: 'MARK_HABIT_DONE',
            habitId,
            dateKey,
          })
        }
      })()
    )
    return
  }

  const targetUrl = data.url || '/'
  event.waitUntil(
    (async () => {
      const windowClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      for (const client of windowClients) {
        if ('focus' in client) {
          await client.focus()
          return
        }
      }
      if (self.clients.openWindow) {
        await self.clients.openWindow(targetUrl)
      }
    })()
  )
})
