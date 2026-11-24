export interface StoredReminderHabit {
  id: string
  name: string
  category: string
  streak: number
  reminderTime: string
  completedToday: boolean
  frozenToday: boolean
  lastActiveDate: string
  color: string
}

export interface PendingCompletion {
  habitId: string
  dateKey: string
}

const DB_NAME = 'maloxie-pwa-db'
const DB_VERSION = 1
const STORE_NAME = 'state'

const REMINDERS_KEY = 'reminders'
const FIRED_MAP_KEY = 'firedKeys'
const PENDING_COMPLETIONS_KEY = 'pendingCompletions'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('Failed to open IndexedDB'))
  })
}

async function idbGet<T>(key: string, fallback: T): Promise<T> {
  try {
    const db = await openDb()
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).get(key)
      req.onsuccess = () => resolve((req.result as T | undefined) ?? fallback)
      req.onerror = () => reject(req.error)
    })
  } catch {
    return fallback
  }
}

async function idbSet<T>(key: string, value: T): Promise<void> {
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const req = tx.objectStore(STORE_NAME).put(value, key)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  } catch {
    // ignore storage failures in private browsing or restricted iframes
  }
}

export async function getStoredReminders(): Promise<StoredReminderHabit[]> {
  return idbGet<StoredReminderHabit[]>(REMINDERS_KEY, [])
}

export async function saveStoredReminders(items: StoredReminderHabit[]): Promise<void> {
  await idbSet(REMINDERS_KEY, items)
}

export async function getFiredReminderKeys(todayKey: string): Promise<string[]> {
  const all = await idbGet<string[]>(FIRED_MAP_KEY, [])
  const prefix = `${todayKey}|`
  return all.filter(k => typeof k === 'string' && k.startsWith(prefix))
}

export async function saveFiredReminderKeys(todayKey: string, keys: string[]): Promise<void> {
  const prefix = `${todayKey}|`
  const cleaned = Array.from(new Set(keys)).filter(k => k.startsWith(prefix)).slice(-200)
  await idbSet(FIRED_MAP_KEY, cleaned)
}

export async function getPendingCompletions(): Promise<PendingCompletion[]> {
  return idbGet<PendingCompletion[]>(PENDING_COMPLETIONS_KEY, [])
}

export async function addPendingCompletion(item: PendingCompletion): Promise<void> {
  const current = await getPendingCompletions()
  const exists = current.some(c => c.habitId === item.habitId && c.dateKey === item.dateKey)
  if (!exists) {
    await idbSet(PENDING_COMPLETIONS_KEY, [...current, item].slice(-50))
  }
}

export async function clearPendingCompletion(habitId: string, dateKey: string): Promise<void> {
  const current = await getPendingCompletions()
  await idbSet(
    PENDING_COMPLETIONS_KEY,
    current.filter(c => !(c.habitId === habitId && c.dateKey === dateKey))
  )
}
