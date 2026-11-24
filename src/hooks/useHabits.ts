import { useCallback, useEffect, useRef, useState } from 'react'
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Timestamp,
} from 'firebase/firestore'
import { useAuth } from '../contexts/AuthContext'
import { db, handleFirestoreError, OperationType, VALIDATION_LIMITS } from '../firebase'
import {
  getTodayDateKey,
  HABIT_CATEGORIES,
  HABIT_PALETTE,
  loadLocalHabits,
  normalizeReminderTime,
  normalizeTag,
  rolloverHabitToToday,
  sanitizeHabit,
  sanitizeTags,
  saveLocalHabits,
  type Habit,
  type HabitCategory,
} from '../lib/habits'

interface FirestoreHabitDoc extends Partial<Habit> {
  ownerId?: string
  createdAt?: Timestamp | null
  updatedAt?: Timestamp | null
}

export function useHabits() {
  const { user, authReady, accountReady } = useAuth()
  const [localHabits, setLocalHabits] = useState<Habit[]>(() => loadLocalHabits())
  const [cloudHabits, setCloudHabits] = useState<Habit[]>([])
  const [cloudLoading, setCloudLoading] = useState(false)
  const [todayKey, setTodayKey] = useState<string>(() => getTodayDateKey())
  const [fatalError, setFatalError] = useState<Error | null>(null)
  const seededUidRef = useRef<string | null>(null)
  const rolledOverRef = useRef<Set<string>>(new Set())

  if (fatalError) {
    throw fatalError
  }

  const isCloudMode = Boolean(user && user.emailVerified && accountReady)

  useEffect(() => {
    saveLocalHabits(localHabits)
  }, [localHabits])

  // Detect midnight / tab return to roll over calendar day automatically
  useEffect(() => {
    const checkDate = () => {
      const current = getTodayDateKey()
      setTodayKey(prev => {
        if (prev === current) return prev
        setLocalHabits(list => list.map(h => rolloverHabitToToday(h, current).habit))
        return current
      })
    }

    const interval = window.setInterval(checkDate, 60_000)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') checkDate()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  useEffect(() => {
    if (!authReady || !user || !user.emailVerified || !accountReady) {
      setCloudHabits([])
      setCloudLoading(false)
      if (!user) {
        seededUidRef.current = null
        rolledOverRef.current.clear()
      }
      return
    }

    let active = true
    const uid = user.uid
    const habitsPath = `users/${uid}/habits`
    const habitsCol = collection(db, 'users', uid, 'habits')
    const habitsQuery = query(habitsCol, where('ownerId', '==', uid))

    setCloudLoading(true)

    const seedIfEmpty = async () => {
      if (seededUidRef.current === uid) return
      seededUidRef.current = uid

      try {
        const existingSnap = await getDocs(habitsQuery)
        if (!active || !existingSnap.empty) return

        const initialHabits = loadLocalHabits()
        for (let i = 0; i < initialHabits.length; i++) {
          const sanitized = sanitizeHabit(initialHabits[i], i, todayKey)
          const docPath = `${habitsPath}/${sanitized.id}`
          try {
            await setDoc(doc(db, 'users', uid, 'habits', sanitized.id), {
              ownerId: uid,
              name: sanitized.name,
              category: sanitized.category,
              streak: sanitized.streak,
              streakFreeze: Math.min(VALIDATION_LIMITS.MAX_CREATE_FREEZE_TOKENS, sanitized.streakFreeze),
              frozenToday: Boolean(sanitized.frozenToday),
              completedToday: Boolean(sanitized.completedToday),
              history: sanitized.history,
              notes: sanitized.notes,
              tags: sanitized.tags,
              lastActiveDate: sanitized.lastActiveDate,
              reminderTime: sanitized.reminderTime ?? '',
              color: sanitized.color,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            })
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, docPath)
          }
        }
      } catch (err) {
        if (active) {
          setFatalError(err instanceof Error ? err : new Error(String(err)))
        }
      }
    }

    void seedIfEmpty()

    const unsubscribe = onSnapshot(
      habitsQuery,
      snapshot => {
        if (!active) return
        const rows = snapshot.docs.map((d, idx) => {
          const data = d.data() as FirestoreHabitDoc
          const createdMs =
            data.createdAt && typeof data.createdAt.toMillis === 'function'
              ? data.createdAt.toMillis()
              : Number.MAX_SAFE_INTEGER

          const base = sanitizeHabit({ ...data, id: d.id, name: data.name || 'Habit' }, idx, todayKey)
          const hasStoredDate =
            typeof data.lastActiveDate === 'string' &&
            VALIDATION_LIMITS.DATE_KEY_PATTERN.test(data.lastActiveDate)
          const rolled = hasStoredDate
            ? rolloverHabitToToday(base, todayKey)
            : { habit: base, changed: false }

          if (rolled.changed) {
            const rollKey = `${uid}:${d.id}:${todayKey}`
            if (!rolledOverRef.current.has(rollKey)) {
              rolledOverRef.current.add(rollKey)
              const docPath = `${habitsPath}/${d.id}`
              void updateDoc(doc(db, 'users', uid, 'habits', d.id), {
                completedToday: false,
                frozenToday: false,
                streak: rolled.habit.streak,
                history: rolled.habit.history,
                lastActiveDate: todayKey,
                updatedAt: serverTimestamp(),
              }).catch(err => {
                try {
                  handleFirestoreError(err, OperationType.UPDATE, docPath)
                } catch (wrapped) {
                  if (active) {
                    setFatalError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)))
                  }
                }
              })
            }
          }

          return {
            habit: rolled.habit,
            createdMs,
          }
        })

        rows.sort((a, b) => a.createdMs - b.createdMs || a.habit.id.localeCompare(b.habit.id))
        setCloudHabits(rows.map(r => r.habit))
        setCloudLoading(false)
      },
      err => {
        if (!active) return
        setCloudLoading(false)
        try {
          handleFirestoreError(err, OperationType.LIST, habitsPath)
        } catch (wrapped) {
          setFatalError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)))
        }
      }
    )

    return () => {
      active = false
      unsubscribe()
    }
  }, [authReady, user, accountReady, todayKey])

  const habits = isCloudMode ? cloudHabits : localHabits

  const toggleHabit = useCallback(
    async (id: string): Promise<Habit | null> => {
      const target = habits.find(h => h.id === id)
      if (!target) return null

      const next = !target.completedToday
      const nextStreak = next ? target.streak + 1 : Math.max(0, target.streak - 1)
      const history = [...target.history]
      history[6] = next

      const updatedHabit: Habit = {
        ...target,
        completedToday: next,
        frozenToday: next ? false : Boolean(target.frozenToday),
        streak: nextStreak,
        history,
      }

      if (isCloudMode && user) {
        const path = `users/${user.uid}/habits/${id}`
        try {
          await updateDoc(doc(db, 'users', user.uid, 'habits', id), {
            completedToday: updatedHabit.completedToday,
            frozenToday: updatedHabit.frozenToday,
            streak: updatedHabit.streak,
            history: updatedHabit.history,
            updatedAt: serverTimestamp(),
          })
        } catch (err) {
          try {
            handleFirestoreError(err, OperationType.UPDATE, path)
          } catch (wrapped) {
            setFatalError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)))
          }
          return null
        }
      } else {
        setLocalHabits(prev => prev.map(h => (h.id === id ? updatedHabit : h)))
      }

      return updatedHabit
    },
    [habits, isCloudMode, user]
  )

  const useStreakFreeze = useCallback(
    async (id: string) => {
      const target = habits.find(h => h.id === id)
      if (!target || target.completedToday || target.frozenToday || target.streakFreeze <= 0) {
        return
      }

      if (isCloudMode && user) {
        const path = `users/${user.uid}/habits/${id}`
        try {
          await updateDoc(doc(db, 'users', user.uid, 'habits', id), {
            streakFreeze: target.streakFreeze - 1,
            frozenToday: true,
            updatedAt: serverTimestamp(),
          })
        } catch (err) {
          try {
            handleFirestoreError(err, OperationType.UPDATE, path)
          } catch (wrapped) {
            setFatalError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)))
          }
        }
      } else {
        setLocalHabits(prev =>
          prev.map(h =>
            h.id === id
              ? { ...h, streakFreeze: h.streakFreeze - 1, frozenToday: true }
              : h
          )
        )
      }
    },
    [habits, isCloudMode, user]
  )

  const addHabitNote = useCallback(
    async (id: string, note: string) => {
      const trimmed = note.trim().slice(0, VALIDATION_LIMITS.MAX_NOTE_LENGTH)
      if (!trimmed) return

      const target = habits.find(h => h.id === id)
      if (!target || target.notes.length >= VALIDATION_LIMITS.MAX_NOTES_COUNT) return

      const nextNotes = [...target.notes, trimmed]

      if (isCloudMode && user) {
        const path = `users/${user.uid}/habits/${id}`
        try {
          await updateDoc(doc(db, 'users', user.uid, 'habits', id), {
            notes: nextNotes,
            updatedAt: serverTimestamp(),
          })
        } catch (err) {
          try {
            handleFirestoreError(err, OperationType.UPDATE, path)
          } catch (wrapped) {
            setFatalError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)))
          }
        }
      } else {
        setLocalHabits(prev =>
          prev.map(h => (h.id === id ? { ...h, notes: nextNotes } : h))
        )
      }
    },
    [habits, isCloudMode, user]
  )

  const addHabitTag = useCallback(
    async (id: string, rawTag: string) => {
      const normalized = normalizeTag(rawTag)
      if (!normalized) return

      const target = habits.find(h => h.id === id)
      if (!target || target.tags.length >= VALIDATION_LIMITS.MAX_TAGS_COUNT) return
      if (target.tags.some(t => t.toLowerCase() === normalized.toLowerCase())) return

      const nextTags = [...target.tags, normalized]

      if (isCloudMode && user) {
        const path = `users/${user.uid}/habits/${id}`
        try {
          await updateDoc(doc(db, 'users', user.uid, 'habits', id), {
            tags: nextTags,
            updatedAt: serverTimestamp(),
          })
        } catch (err) {
          try {
            handleFirestoreError(err, OperationType.UPDATE, path)
          } catch (wrapped) {
            setFatalError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)))
          }
        }
      } else {
        setLocalHabits(prev =>
          prev.map(h => (h.id === id ? { ...h, tags: nextTags } : h))
        )
      }
    },
    [habits, isCloudMode, user]
  )

  const removeHabitTag = useCallback(
    async (id: string, tagToRemove: string) => {
      const target = habits.find(h => h.id === id)
      if (!target) return

      const nextTags = target.tags.filter(t => t !== tagToRemove)
      if (nextTags.length === target.tags.length) return

      if (isCloudMode && user) {
        const path = `users/${user.uid}/habits/${id}`
        try {
          await updateDoc(doc(db, 'users', user.uid, 'habits', id), {
            tags: nextTags,
            updatedAt: serverTimestamp(),
          })
        } catch (err) {
          try {
            handleFirestoreError(err, OperationType.UPDATE, path)
          } catch (wrapped) {
            setFatalError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)))
          }
        }
      } else {
        setLocalHabits(prev =>
          prev.map(h => (h.id === id ? { ...h, tags: nextTags } : h))
        )
      }
    },
    [habits, isCloudMode, user]
  )

  const setHabitReminder = useCallback(
    async (id: string, reminderTime: string) => {
      const normalized = normalizeReminderTime(reminderTime)
      const target = habits.find(h => h.id === id)
      if (!target || (target.reminderTime ?? '') === normalized) return

      if (isCloudMode && user) {
        const path = `users/${user.uid}/habits/${id}`
        try {
          await updateDoc(doc(db, 'users', user.uid, 'habits', id), {
            reminderTime: normalized,
            updatedAt: serverTimestamp(),
          })
        } catch (err) {
          try {
            handleFirestoreError(err, OperationType.UPDATE, path)
          } catch (wrapped) {
            setFatalError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)))
          }
        }
      } else {
        setLocalHabits(prev =>
          prev.map(h => (h.id === id ? { ...h, reminderTime: normalized } : h))
        )
      }
    },
    [habits, isCloudMode, user]
  )

  const editHabit = useCallback(
    async (
      id: string,
      updates: { name: string; category: HabitCategory; color: string; reminderTime?: string }
    ) => {
      const safeName = updates.name.trim().slice(0, VALIDATION_LIMITS.MAX_HABIT_NAME_LENGTH)
      if (!safeName) return
      const safeCategory = HABIT_CATEGORIES.includes(updates.category) ? updates.category : 'Other'
      const safeColor = VALIDATION_LIMITS.HEX_COLOR_PATTERN.test(updates.color)
        ? updates.color
        : HABIT_PALETTE[0]
      const hasReminderUpdate = updates.reminderTime !== undefined
      const safeReminder = hasReminderUpdate ? normalizeReminderTime(updates.reminderTime) : undefined

      if (isCloudMode && user) {
        const path = `users/${user.uid}/habits/${id}`
        try {
          await updateDoc(doc(db, 'users', user.uid, 'habits', id), {
            name: safeName,
            category: safeCategory,
            color: safeColor,
            ...(hasReminderUpdate ? { reminderTime: safeReminder } : {}),
            updatedAt: serverTimestamp(),
          })
        } catch (err) {
          try {
            handleFirestoreError(err, OperationType.UPDATE, path)
          } catch (wrapped) {
            setFatalError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)))
          }
        }
      } else {
        setLocalHabits(prev =>
          prev.map(h =>
            h.id === id
              ? {
                  ...h,
                  name: safeName,
                  category: safeCategory,
                  color: safeColor,
                  ...(hasReminderUpdate ? { reminderTime: safeReminder } : {}),
                }
              : h
          )
        )
      }
    },
    [isCloudMode, user]
  )

  const createHabit = useCallback(
    async (
      name: string,
      category: HabitCategory,
      initialTags: string[] = [],
      reminderTime: string = ''
    ) => {
      const trimmed = name.trim().slice(0, VALIDATION_LIMITS.MAX_HABIT_NAME_LENGTH)
      if (!trimmed) return

      const id = crypto.randomUUID()
      const color = HABIT_PALETTE[habits.length % HABIT_PALETTE.length]
      const cleanTags = sanitizeTags(initialTags)
      const activeDate = getTodayDateKey()
      const safeReminder = normalizeReminderTime(reminderTime)
      const newHabit: Habit = {
        id,
        name: trimmed,
        category,
        streak: 0,
        streakFreeze: 1,
        frozenToday: false,
        completedToday: false,
        history: [false, false, false, false, false, false, false],
        notes: [],
        tags: cleanTags,
        lastActiveDate: activeDate,
        reminderTime: safeReminder,
        color,
      }

      if (isCloudMode && user) {
        const path = `users/${user.uid}/habits/${id}`
        try {
          await setDoc(doc(db, 'users', user.uid, 'habits', id), {
            ownerId: user.uid,
            name: newHabit.name,
            category: newHabit.category,
            streak: newHabit.streak,
            streakFreeze: newHabit.streakFreeze,
            frozenToday: false,
            completedToday: false,
            history: newHabit.history,
            notes: [],
            tags: newHabit.tags,
            lastActiveDate: newHabit.lastActiveDate,
            reminderTime: safeReminder,
            color: newHabit.color,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
        } catch (err) {
          try {
            handleFirestoreError(err, OperationType.CREATE, path)
          } catch (wrapped) {
            setFatalError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)))
          }
        }
      } else {
        setLocalHabits(prev => [...prev, newHabit])
      }
    },
    [habits.length, isCloudMode, user]
  )

  const deleteHabit = useCallback(
    async (id: string) => {
      if (isCloudMode && user) {
        const path = `users/${user.uid}/habits/${id}`
        try {
          await deleteDoc(doc(db, 'users', user.uid, 'habits', id))
        } catch (err) {
          try {
            handleFirestoreError(err, OperationType.DELETE, path)
          } catch (wrapped) {
            setFatalError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)))
          }
        }
      } else {
        setLocalHabits(prev => prev.filter(h => h.id !== id))
      }
    },
    [isCloudMode, user]
  )

  return {
    habits,
    isCloudMode,
    cloudLoading,
    toggleHabit,
    useStreakFreeze,
    addHabitNote,
    addHabitTag,
    removeHabitTag,
    setHabitReminder,
    editHabit,
    createHabit,
    deleteHabit,
  }
}
