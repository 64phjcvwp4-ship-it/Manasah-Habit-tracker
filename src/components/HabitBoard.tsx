import { useMemo, useState } from 'react'
import {
  Bell,
  BellOff,
  Check,
  Layers,
  LayoutGrid,
  MessageSquarePlus,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Snowflake,
  Tag,
  Trash2,
  X,
} from 'lucide-react'
import { VALIDATION_LIMITS } from '../firebase'
import { useTheme } from '../contexts/ThemeContext'
import {
  formatReminderTime,
  getCategoryMeta,
  HABIT_CATEGORIES,
  HABIT_PALETTE,
  type Habit,
  type HabitCategory,
} from '../lib/habits'

export function HabitBoard({
  habits,
  onToggle,
  onUseToken,
  onAddNote,
  onAddTag,
  onRemoveTag,
  onSetReminder,
  onEdit,
  onDelete,
}: {
  habits: Habit[]
  onToggle: (id: string) => void
  onUseToken: (id: string) => void
  onAddNote: (id: string, note: string) => void
  onAddTag: (id: string, tag: string) => void
  onRemoveTag: (id: string, tag: string) => void
  onSetReminder?: (id: string, reminderTime: string) => void
  onEdit?: (
    id: string,
    updates: { name: string; category: HabitCategory; color: string; reminderTime?: string }
  ) => void
  onDelete?: (id: string) => void
}) {
  const { theme } = useTheme()
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [selectedTag, setSelectedTag] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [grouped, setGrouped] = useState<boolean>(false)
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({})
  const [tagDrafts, setTagDrafts] = useState<Record<string, string>>({})
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({})
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [reminderPickerId, setReminderPickerId] = useState<string | null>(null)
  const [reminderDraft, setReminderDraft] = useState<string>('09:00')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<{
    name: string
    category: HabitCategory
    color: string
    reminderTime: string
  }>({ name: '', category: 'Focus', color: HABIT_PALETTE[0], reminderTime: '' })

  const categorySummaries = useMemo(() => {
    const map = new Map<HabitCategory, { total: number; done: number }>()
    for (const cat of HABIT_CATEGORIES) {
      map.set(cat, { total: 0, done: 0 })
    }
    for (const h of habits) {
      const cat: HabitCategory = HABIT_CATEGORIES.includes(h.category) ? h.category : 'Other'
      const entry = map.get(cat)!
      entry.total += 1
      if (h.completedToday) entry.done += 1
    }
    return HABIT_CATEGORIES.map(cat => ({
      meta: getCategoryMeta(cat),
      total: map.get(cat)!.total,
      done: map.get(cat)!.done,
    }))
  }, [habits])

  const availableTags = useMemo(() => {
    const counts = new Map<string, { label: string; count: number; color: string; ink: string }>()
    for (const h of habits) {
      const catMeta = getCategoryMeta(h.category)
      const ink = theme === 'light' ? catMeta.lightInk : catMeta.darkInk
      for (const tag of h.tags ?? []) {
        const key = tag.toLowerCase()
        const existing = counts.get(key)
        if (existing) {
          existing.count += 1
        } else {
          counts.set(key, { label: tag, count: 1, color: catMeta.color, ink })
        }
      }
    }
    return Array.from(counts.entries())
      .map(([key, val]) => ({
        key,
        label: val.label,
        count: val.count,
        color: val.color,
        ink: val.ink,
      }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
  }, [habits, theme])

  const activeFilter =
    selectedCategory === 'All' || HABIT_CATEGORIES.includes(selectedCategory as HabitCategory)
      ? selectedCategory
      : 'All'

  const activeTagFilter =
    selectedTag === 'All' || availableTags.some(t => t.key === selectedTag.toLowerCase())
      ? selectedTag
      : 'All'

  const normalizedQuery = searchQuery.trim().toLowerCase()

  const filteredHabits = useMemo(
    () =>
      habits.filter(h => {
        const matchesCategory =
          activeFilter === 'All' || (h.category || 'Other') === activeFilter
        const matchesTag =
          activeTagFilter === 'All' ||
          (h.tags ?? []).some(t => t.toLowerCase() === activeTagFilter.toLowerCase())
        const matchesSearch =
          !normalizedQuery ||
          h.name.toLowerCase().includes(normalizedQuery) ||
          (h.category || '').toLowerCase().includes(normalizedQuery) ||
          (h.tags ?? []).some(t => t.toLowerCase().includes(normalizedQuery)) ||
          (h.notes ?? []).some(n => n.toLowerCase().includes(normalizedQuery))
        return matchesCategory && matchesTag && matchesSearch
      }),
    [habits, activeFilter, activeTagFilter, normalizedQuery]
  )

  const groupedHabits = useMemo(() => {
    const map = new Map<string, Habit[]>()
    for (const h of filteredHabits) {
      const cat = h.category || 'Other'
      const list = map.get(cat)
      if (list) list.push(h)
      else map.set(cat, [h])
    }
    return Array.from(map.entries())
  }, [filteredHabits])

  const handleNoteSubmit = (e: React.FormEvent, id: string) => {
    e.preventDefault()
    const draft = (noteDrafts[id] ?? '').trim()
    if (!draft) return
    onAddNote(id, draft)
    setNoteDrafts(prev => ({ ...prev, [id]: '' }))
  }

  const handleTagSubmit = (e: React.FormEvent, id: string) => {
    e.preventDefault()
    const draft = (tagDrafts[id] ?? '').trim()
    if (!draft) return
    onAddTag(id, draft)
    setTagDrafts(prev => ({ ...prev, [id]: '' }))
  }

  const startEdit = (h: Habit) => {
    setReminderPickerId(null)
    setEditingId(h.id)
    setEditDraft({
      name: h.name,
      category: h.category,
      color: h.color,
      reminderTime: h.reminderTime ?? '',
    })
  }

  const handleEditSubmit = (e: React.FormEvent, id: string) => {
    e.preventDefault()
    if (!onEdit || !editDraft.name.trim()) return
    onEdit(id, editDraft)
    setEditingId(null)
  }

  const openReminderPicker = (h: Habit) => {
    if (reminderPickerId === h.id) {
      setReminderPickerId(null)
      return
    }
    setReminderDraft(h.reminderTime || '09:00')
    setReminderPickerId(h.id)
  }

  const handleReminderSubmit = (e: React.FormEvent, id: string) => {
    e.preventDefault()
    if (!onSetReminder || !reminderDraft) return
    onSetReminder(id, reminderDraft)
    setReminderPickerId(null)
  }

  const renderCard = (h: Habit) => {
    const canUseToken = !h.completedToday && !h.frozenToday && h.streakFreeze > 0
    const draft = noteDrafts[h.id] ?? ''
    const tagDraft = tagDrafts[h.id] ?? ''
    const habitTags = h.tags ?? []
    const isEditing = editingId === h.id
    const isPickingReminder = reminderPickerId === h.id
    const reminderLabel = formatReminderTime(h.reminderTime)
    const showAllNotes = Boolean(expandedNotes[h.id])
    const visibleNotes = showAllNotes ? h.notes : h.notes.slice(-2)
    const hiddenCount = h.notes.length - visibleNotes.length
    const catMeta = getCategoryMeta(h.category)
    const catInk = theme === 'light' ? catMeta.lightInk : catMeta.darkInk
    const isCategoryFiltered = activeFilter === catMeta.name

    return (
      <div
        key={h.id}
        className={`habit-card ${h.completedToday ? 'done' : ''} ${h.frozenToday ? 'frozen' : ''}`}
        style={
          {
            '--accent': h.color,
            '--cat-color': catMeta.color,
            '--cat-ink': catInk,
          } as React.CSSProperties
        }
      >
        {isEditing ? (
          <form className="habit-edit-panel" onSubmit={e => handleEditSubmit(e, h.id)}>
            <div className="edit-panel-header">
              <span>Edit habit</span>
              <button
                type="button"
                className="edit-cancel-icon"
                onClick={() => setEditingId(null)}
                aria-label="Cancel editing"
              >
                <X size={14} />
              </button>
            </div>
            <input
              type="text"
              value={editDraft.name}
              maxLength={VALIDATION_LIMITS.MAX_HABIT_NAME_LENGTH}
              onChange={e => setEditDraft(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Habit name"
              aria-label="Edit habit name"
              autoFocus
            />
            <select
              value={editDraft.category}
              onChange={e =>
                setEditDraft(prev => ({ ...prev, category: e.target.value as HabitCategory }))
              }
              aria-label="Edit habit category"
            >
              {HABIT_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <div className="edit-color-row" role="radiogroup" aria-label="Habit accent color">
              {HABIT_PALETTE.map(color => (
                <button
                  key={color}
                  type="button"
                  role="radio"
                  aria-checked={editDraft.color === color}
                  className={`color-swatch ${editDraft.color === color ? 'selected' : ''}`}
                  style={{ background: color }}
                  onClick={() => setEditDraft(prev => ({ ...prev, color }))}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
            <div className="edit-reminder-row">
              <label htmlFor={`edit-reminder-${h.id}`}>Daily reminder</label>
              <div className="edit-reminder-controls">
                <input
                  id={`edit-reminder-${h.id}`}
                  type="time"
                  value={editDraft.reminderTime}
                  onChange={e => setEditDraft(prev => ({ ...prev, reminderTime: e.target.value }))}
                  aria-label="Edit daily reminder time"
                />
                {editDraft.reminderTime && (
                  <button
                    type="button"
                    className="edit-clear-time"
                    onClick={() => setEditDraft(prev => ({ ...prev, reminderTime: '' }))}
                    title="Clear reminder"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            <div className="edit-actions">
              <button
                type="button"
                className="edit-cancel-btn"
                onClick={() => setEditingId(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="edit-save-btn"
                disabled={!editDraft.name.trim()}
              >
                Save
              </button>
            </div>
          </form>
        ) : (
          <div className="habit-main-wrap">
            <div className="habit-card-top-bar">
              <button
                type="button"
                className={`habit-category-tag ${isCategoryFiltered ? 'active' : ''}`}
                onClick={() => setSelectedCategory(isCategoryFiltered ? 'All' : catMeta.name)}
                title={
                  isCategoryFiltered
                    ? `Clear ${catMeta.name} filter`
                    : `Filter by ${catMeta.name}`
                }
              >
                <span className="cat-swatch" aria-hidden="true" />
                <span>{catMeta.name}</span>
              </button>

              <button
                type="button"
                className={`check ${h.completedToday ? 'on' : ''}`}
                onClick={() => onToggle(h.id)}
                aria-pressed={h.completedToday}
                aria-label={
                  h.completedToday ? `Mark ${h.name} incomplete` : `Mark ${h.name} done today`
                }
              >
                <Check size={16} strokeWidth={3} />
              </button>
            </div>

            <button
              type="button"
              className="habit-main"
              onClick={() => onToggle(h.id)}
              aria-pressed={h.completedToday}
            >
              <span className="habit-name">{h.name}</span>
              <div className="habit-meta">
                <span className="streak">{h.streak} day streak</span>
                <div className="dots" aria-label="Last 7 days">
                  {h.history.map((d, i) => (
                    <span key={i} className={`dot ${d ? 'filled' : ''}`} />
                  ))}
                </div>
              </div>
            </button>
          </div>
        )}

        <div className="habit-freeze-row">
          <span className="token-count" title="Remaining streak freeze tokens">
            <Snowflake size={13} />
            <span>
              {h.streakFreeze} {h.streakFreeze === 1 ? 'token' : 'tokens'}
            </span>
          </span>

          <div className="habit-row-actions">
            {h.frozenToday ? (
              <span className="frozen-badge">
                <ShieldCheck size={13} />
                Streak frozen today
              </span>
            ) : (
              <button
                type="button"
                className="use-token-btn"
                onClick={() => onUseToken(h.id)}
                disabled={!canUseToken}
                title={
                  h.completedToday
                    ? 'Already completed today'
                    : h.streakFreeze <= 0
                      ? 'No freeze tokens left'
                      : 'Use 1 streak freeze token to protect your streak today'
                }
              >
                <Snowflake size={13} />
                Use Token
              </button>
            )}

            {onSetReminder && !isEditing && (
              <button
                type="button"
                className={`reminder-chip-btn ${reminderLabel ? 'active' : ''}`}
                onClick={() => openReminderPicker(h)}
                aria-expanded={isPickingReminder}
                aria-label={
                  reminderLabel
                    ? `Daily reminder at ${reminderLabel} for ${h.name}`
                    : `Set daily reminder for ${h.name}`
                }
                title={reminderLabel ? `Daily reminder at ${reminderLabel}` : 'Set daily reminder'}
              >
                <Bell size={12} />
                <span>{reminderLabel || 'Remind'}</span>
              </button>
            )}

            {onEdit && !isEditing && (
              <button
                type="button"
                className="edit-habit-btn"
                onClick={() => startEdit(h)}
                aria-label={`Edit ${h.name}`}
                title="Edit habit"
              >
                <Pencil size={13} />
              </button>
            )}

            {onDelete && (
              confirmDeleteId === h.id ? (
                <button
                  type="button"
                  className="delete-confirm-btn"
                  onClick={() => {
                    onDelete(h.id)
                    setConfirmDeleteId(null)
                  }}
                  onBlur={() => setConfirmDeleteId(null)}
                  title="Click again to delete habit"
                >
                  Delete?
                </button>
              ) : (
                <button
                  type="button"
                  className="delete-habit-btn"
                  onClick={() => setConfirmDeleteId(h.id)}
                  aria-label={`Delete ${h.name}`}
                  title="Delete habit"
                >
                  <Trash2 size={13} />
                </button>
              )
            )}
          </div>
        </div>

        {onSetReminder && isPickingReminder && (
          <form className="reminder-picker-row" onSubmit={e => handleReminderSubmit(e, h.id)}>
            <label htmlFor={`reminder-time-${h.id}`} className="reminder-picker-label">
              Daily at
            </label>
            <input
              id={`reminder-time-${h.id}`}
              type="time"
              value={reminderDraft}
              onChange={e => setReminderDraft(e.target.value)}
              required
              aria-label={`Reminder time for ${h.name}`}
            />
            <button type="submit" className="reminder-save-btn">
              Save
            </button>
            {reminderLabel && (
              <button
                type="button"
                className="reminder-off-btn"
                onClick={() => {
                  onSetReminder(h.id, '')
                  setReminderPickerId(null)
                }}
                title="Turn off reminder"
                aria-label={`Turn off reminder for ${h.name}`}
              >
                <BellOff size={13} />
              </button>
            )}
            <button
              type="button"
              className="reminder-cancel-btn"
              onClick={() => setReminderPickerId(null)}
              aria-label="Close reminder picker"
            >
              <X size={13} />
            </button>
          </form>
        )}

        <div className="habit-tags-section">
          {habitTags.length > 0 && (
            <div className="habit-tags-list" aria-label={`Tags for ${h.name}`}>
              {habitTags.map(tag => {
                const isSelected = activeTagFilter.toLowerCase() === tag.toLowerCase()
                return (
                  <span key={tag} className={`habit-tag-chip ${isSelected ? 'selected' : ''}`}>
                    <button
                      type="button"
                      className="habit-tag-label"
                      onClick={() => setSelectedTag(isSelected ? 'All' : tag)}
                      title={isSelected ? `Clear #${tag} filter` : `Filter by #${tag}`}
                    >
                      #{tag}
                    </button>
                    <button
                      type="button"
                      className="habit-tag-remove"
                      onClick={() => onRemoveTag(h.id, tag)}
                      aria-label={`Remove tag ${tag} from ${h.name}`}
                      title={`Remove #${tag}`}
                    >
                      <X size={11} />
                    </button>
                  </span>
                )
              })}
            </div>
          )}

          <form className="habit-tag-form" onSubmit={e => handleTagSubmit(e, h.id)}>
            <Tag size={12} className="tag-input-icon" />
            <input
              type="text"
              value={tagDraft}
              maxLength={VALIDATION_LIMITS.MAX_TAG_LENGTH}
              onChange={e => setTagDrafts(prev => ({ ...prev, [h.id]: e.target.value }))}
              placeholder={
                habitTags.length >= VALIDATION_LIMITS.MAX_TAGS_COUNT
                  ? 'Tag limit reached (15)'
                  : 'Add custom tag…'
              }
              disabled={habitTags.length >= VALIDATION_LIMITS.MAX_TAGS_COUNT}
              aria-label={`Add custom tag for ${h.name}`}
            />
            <button
              type="submit"
              className="tag-submit-btn"
              disabled={!tagDraft.trim() || habitTags.length >= VALIDATION_LIMITS.MAX_TAGS_COUNT}
              aria-label={`Save tag for ${h.name}`}
              title="Add tag"
            >
              <Plus size={13} />
            </button>
          </form>
        </div>

        <div className="habit-notes-section">
          {h.notes.length > 0 && (
            <>
              <ul className="habit-notes-list" aria-label={`Logs for ${h.name}`}>
                {visibleNotes.map((note, idx) => (
                  <li key={`${idx}-${note.slice(0, 16)}`}>{note}</li>
                ))}
              </ul>
              {(hiddenCount > 0 || showAllNotes) && h.notes.length > 2 && (
                <button
                  type="button"
                  className="notes-expand-btn"
                  onClick={() => setExpandedNotes(prev => ({ ...prev, [h.id]: !showAllNotes }))}
                >
                  {showAllNotes ? 'Show fewer logs' : `Show all ${h.notes.length} logs`}
                </button>
              )}
            </>
          )}

          <form className="habit-note-form" onSubmit={e => handleNoteSubmit(e, h.id)}>
            <input
              type="text"
              value={draft}
              maxLength={VALIDATION_LIMITS.MAX_NOTE_LENGTH}
              onChange={e => setNoteDrafts(prev => ({ ...prev, [h.id]: e.target.value }))}
              placeholder={
                h.notes.length >= VALIDATION_LIMITS.MAX_NOTES_COUNT
                  ? 'Note limit reached (50)'
                  : 'Add daily log or thought…'
              }
              disabled={h.notes.length >= VALIDATION_LIMITS.MAX_NOTES_COUNT}
              aria-label={`Add note for ${h.name}`}
            />
            <button
              type="submit"
              className="note-submit-btn"
              disabled={!draft.trim() || h.notes.length >= VALIDATION_LIMITS.MAX_NOTES_COUNT}
              aria-label={`Save log for ${h.name}`}
              title="Add log"
            >
              <MessageSquarePlus size={14} />
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="habit-board">
      {/* Color-coded Habit Categories Directory & Filter */}
      <div className="categories-directory glass" aria-label="Habit categories">
        <div className="categories-dir-header">
          <span className="categories-dir-title">Categories</span>
          <span className="categories-dir-hint">
            {activeFilter === 'All'
              ? `${HABIT_CATEGORIES.length} categories · click any tag to filter`
              : `Filtering by ${activeFilter}`}
          </span>
        </div>

        <div className="category-tabs" role="tablist" aria-label="Filter habits by category">
          <button
            type="button"
            role="tab"
            aria-selected={activeFilter === 'All'}
            className={`cat-tab all-tab ${activeFilter === 'All' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('All')}
          >
            <span>All</span>
            <span className="cat-count">{habits.length}</span>
          </button>

          {categorySummaries.map(({ meta, total, done }) => {
            const isSelected = activeFilter === meta.name
            const ink = theme === 'light' ? meta.lightInk : meta.darkInk
            return (
              <button
                key={meta.name}
                type="button"
                role="tab"
                aria-selected={isSelected}
                className={`cat-tab color-coded ${isSelected ? 'active' : ''} ${total === 0 ? 'empty' : ''}`}
                style={
                  {
                    '--cat-color': meta.color,
                    '--cat-ink': ink,
                  } as React.CSSProperties
                }
                onClick={() => setSelectedCategory(isSelected ? 'All' : meta.name)}
                title={`${meta.description} (${done}/${total} done today)`}
              >
                <span className="cat-swatch" aria-hidden="true" />
                <span>{meta.name}</span>
                <span className="cat-count">{total > 0 ? `${done}/${total}` : '0'}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="board-controls">
        {availableTags.length > 0 ? (
          <div className="tag-filter-bar" role="group" aria-label="Filter habits by tag">
            <span className="tag-filter-heading">
              <Tag size={13} />
              <span>Tags</span>
            </span>
            <div className="tag-filter-tabs">
              <button
                type="button"
                className={`tag-filter-btn ${activeTagFilter === 'All' ? 'active' : ''}`}
                aria-pressed={activeTagFilter === 'All'}
                onClick={() => setSelectedTag('All')}
              >
                All tags
              </button>
              {availableTags.map(t => {
                const isSelected = activeTagFilter.toLowerCase() === t.key
                return (
                  <button
                    key={t.key}
                    type="button"
                    className={`tag-filter-btn color-tinted ${isSelected ? 'active' : ''}`}
                    style={
                      {
                        '--tag-color': t.color,
                        '--tag-ink': t.ink,
                      } as React.CSSProperties
                    }
                    aria-pressed={isSelected}
                    onClick={() => setSelectedTag(isSelected ? 'All' : t.label)}
                  >
                    #{t.label} <span className="cat-count">{t.count}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div />
        )}

        <div className="board-right-controls">
          <div className="board-search">
            <Search size={14} className="search-icon" />
            <input
              type="search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search habits, tags…"
              aria-label="Search habits"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <button
            type="button"
            className={`group-toggle ${grouped ? 'active' : ''}`}
            onClick={() => setGrouped(g => !g)}
            aria-pressed={grouped}
            title={grouped ? 'Switch to flat grid' : 'Group by category'}
          >
            {grouped ? <Layers size={15} /> : <LayoutGrid size={15} />}
            <span>{grouped ? 'Grouped' : 'Grid'}</span>
          </button>
        </div>
      </div>

      {filteredHabits.length === 0 ? (
        <div className="empty-state">
          <p>No habits match the current filters.</p>
          {(activeFilter !== 'All' || activeTagFilter !== 'All' || Boolean(normalizedQuery)) && (
            <button
              type="button"
              className="clear-filters-btn"
              onClick={() => {
                setSelectedCategory('All')
                setSelectedTag('All')
                setSearchQuery('')
              }}
            >
              Reset filters
            </button>
          )}
        </div>
      ) : grouped ? (
        <div className="habit-groups">
          {groupedHabits.map(([category, items]) => {
            const doneCount = items.filter(i => i.completedToday).length
            const meta = getCategoryMeta(category)
            const ink = theme === 'light' ? meta.lightInk : meta.darkInk
            return (
              <div
                key={category}
                className="habit-group"
                style={
                  {
                    '--cat-color': meta.color,
                    '--cat-ink': ink,
                  } as React.CSSProperties
                }
              >
                <div className="group-header">
                  <div className="group-title-wrap">
                    <span className="cat-swatch" aria-hidden="true" />
                    <h3>{category}</h3>
                  </div>
                  <span>
                    {doneCount}/{items.length} done
                  </span>
                </div>
                <div className="habit-grid">{items.map(renderCard)}</div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="habit-grid">{filteredHabits.map(renderCard)}</div>
      )}

      <style>{`
        .habit-board {
          display: flex;
          flex-direction: column;
          gap: 1.15rem;
        }
        .categories-directory {
          padding: 0.85rem 1rem;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }
        .categories-dir-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .categories-dir-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.86rem;
          font-weight: 600;
          color: var(--text);
        }
        .categories-dir-hint {
          font-size: 0.76rem;
          color: var(--muted);
        }
        .category-tabs {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          flex-wrap: wrap;
        }
        .cat-swatch {
          width: 8px;
          height: 8px;
          border-radius: 3px;
          background: var(--cat-color);
          flex-shrink: 0;
        }
        .cat-tab {
          display: inline-flex;
          align-items: center;
          gap: 0.42rem;
          padding: 0.42rem 0.78rem;
          border-radius: 10px;
          background: var(--surface-subtle);
          border: 1px solid var(--border);
          color: var(--muted);
          font-size: 0.81rem;
          font-weight: 500;
          white-space: nowrap;
          transition: color 0.18s, border-color 0.18s, background 0.18s;
        }
        .cat-tab.color-coded {
          background: color-mix(in srgb, var(--cat-color) 10%, transparent);
          border-color: color-mix(in srgb, var(--cat-color) 28%, transparent);
          color: var(--cat-ink);
        }
        .cat-tab.color-coded.empty {
          opacity: 0.72;
        }
        .cat-tab:hover {
          color: var(--text);
          border-color: color-mix(in srgb, var(--accent) 42%, transparent);
        }
        .cat-tab.color-coded:hover {
          opacity: 1;
          color: var(--cat-ink);
          background: color-mix(in srgb, var(--cat-color) 18%, transparent);
          border-color: color-mix(in srgb, var(--cat-color) 52%, transparent);
        }
        .cat-tab.all-tab.active {
          color: var(--text);
          background: color-mix(in srgb, var(--accent) 18%, transparent);
          border-color: color-mix(in srgb, var(--accent) 48%, transparent);
          font-weight: 600;
        }
        .cat-tab.color-coded.active {
          opacity: 1;
          color: var(--cat-ink);
          background: color-mix(in srgb, var(--cat-color) 24%, transparent);
          border-color: var(--cat-color);
          font-weight: 600;
          box-shadow: 0 0 0 1px color-mix(in srgb, var(--cat-color) 32%, transparent);
        }
        .cat-count {
          font-size: 0.72rem;
          opacity: 0.82;
          font-variant-numeric: tabular-nums;
        }
        .board-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .board-right-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .board-search {
          position: relative;
          display: flex;
          align-items: center;
          background: var(--surface-card);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 0 0.55rem;
          height: 36px;
          min-width: 185px;
        }
        .board-search:focus-within {
          border-color: color-mix(in srgb, var(--accent) 50%, transparent);
        }
        .search-icon {
          color: var(--muted);
          opacity: 0.75;
          margin-right: 0.35rem;
          flex-shrink: 0;
        }
        .board-search input {
          background: transparent;
          border: none;
          outline: none;
          color: var(--text);
          font-size: 0.82rem;
          width: 100%;
          min-width: 0;
        }
        .board-search input::placeholder {
          color: var(--muted);
          opacity: 0.75;
        }
        .search-clear {
          color: var(--muted);
          display: grid;
          place-items: center;
          padding: 2px;
        }
        .group-toggle {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.42rem 0.85rem;
          border-radius: 10px;
          background: var(--surface-card);
          border: 1px solid var(--border);
          color: var(--muted);
          font-size: 0.82rem;
          font-weight: 500;
          height: 36px;
          white-space: nowrap;
          transition: color 0.18s, border-color 0.18s, background 0.18s;
        }
        .group-toggle:hover,
        .group-toggle.active {
          color: var(--text);
          background: color-mix(in srgb, var(--accent) 16%, transparent);
          border-color: color-mix(in srgb, var(--accent) 42%, transparent);
        }
        .habit-groups {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .habit-group {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .group-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          padding-bottom: 0.45rem;
          border-bottom: 1px solid color-mix(in srgb, var(--cat-color) 32%, var(--border));
        }
        .group-title-wrap {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }
        .group-header h3 {
          font-size: 1rem;
          font-weight: 600;
          color: var(--cat-ink);
        }
        .group-header span:last-child {
          font-size: 0.78rem;
          color: var(--muted);
          font-variant-numeric: tabular-nums;
        }
        .habit-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(275px, 1fr));
          gap: 1rem;
        }
        .habit-card {
          display: flex;
          flex-direction: column;
          border-radius: 18px;
          background: var(--surface-card);
          border: 1px solid var(--border);
          backdrop-filter: blur(12px);
          transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
          color: inherit;
          overflow: hidden;
        }
        .habit-card:hover {
          border-color: color-mix(in srgb, var(--accent) 48%, transparent);
          transform: translateY(-2px);
          box-shadow: var(--shadow-card);
        }
        .habit-card.done {
          border-color: color-mix(in srgb, var(--accent) 58%, transparent);
          box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent) 22%, transparent);
        }
        .habit-card.frozen {
          border-color: var(--freeze-border);
          box-shadow: 0 0 0 1px color-mix(in srgb, var(--freeze-ink) 20%, transparent);
        }
        .habit-main-wrap {
          display: flex;
          flex-direction: column;
        }
        .habit-card-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.65rem;
          padding: 1rem 1.25rem 0;
        }
        .habit-category-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.38rem;
          padding: 0.22rem 0.56rem;
          border-radius: 7px;
          background: color-mix(in srgb, var(--cat-color) 13%, transparent);
          border: 1px solid color-mix(in srgb, var(--cat-color) 32%, transparent);
          color: var(--cat-ink);
          font-size: 0.72rem;
          font-weight: 600;
          white-space: nowrap;
          transition: background 0.18s, border-color 0.18s;
        }
        .habit-category-tag:hover,
        .habit-category-tag.active {
          background: color-mix(in srgb, var(--cat-color) 24%, transparent);
          border-color: var(--cat-color);
        }
        .habit-main {
          width: 100%;
          text-align: left;
          padding: 0.55rem 1.25rem 0.9rem;
          color: inherit;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }
        .habit-edit-panel {
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
          padding: 1rem 1.15rem;
        }
        .edit-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.76rem;
          font-weight: 600;
          color: var(--accent-2);
        }
        .edit-cancel-icon {
          color: var(--muted);
          padding: 2px;
        }
        .habit-edit-panel input,
        .habit-edit-panel select {
          background: var(--surface-input);
          border: 1px solid var(--border-strong);
          border-radius: 8px;
          padding: 0.42rem 0.65rem;
          color: var(--text);
          font-size: 0.84rem;
          outline: none;
        }
        .habit-edit-panel select {
          background: var(--surface-solid);
        }
        .edit-color-row {
          display: flex;
          align-items: center;
          gap: 0.45rem;
        }
        .color-swatch {
          width: 20px;
          height: 20px;
          border-radius: 6px;
          border: 2px solid transparent;
          transition: transform 0.15s, border-color 0.15s;
        }
        .color-swatch.selected {
          border-color: var(--text);
          transform: scale(1.1);
        }
        .edit-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.45rem;
          margin-top: 0.15rem;
        }
        .edit-cancel-btn {
          padding: 0.35rem 0.7rem;
          border-radius: 8px;
          background: var(--surface-subtle);
          color: var(--muted);
          font-size: 0.78rem;
          font-weight: 500;
        }
        .edit-save-btn {
          padding: 0.35rem 0.75rem;
          border-radius: 8px;
          background: var(--accent);
          color: var(--accent-contrast);
          font-size: 0.78rem;
          font-weight: 600;
        }
        .habit-name {
          font-weight: 600;
          font-size: 1.04rem;
          line-height: 1.3;
          color: var(--text);
        }
        .check {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid var(--border-strong);
          display: grid;
          place-items: center;
          color: transparent;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .check:hover {
          border-color: var(--accent);
        }
        .check.on {
          background: var(--accent);
          border-color: var(--accent);
          color: var(--accent-contrast);
        }
        .habit-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.75rem;
        }
        .streak {
          font-size: 0.78rem;
          color: var(--muted);
          font-variant-numeric: tabular-nums;
        }
        .dots {
          display: flex;
          gap: 4px;
        }
        .dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--dot-empty);
        }
        .dot.filled {
          background: var(--accent);
        }
        .habit-freeze-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.6rem;
          padding: 0.65rem 1.25rem;
          border-top: 1px solid var(--border);
        }
        .habit-row-actions {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
        }
        .edit-habit-btn,
        .delete-habit-btn {
          width: 26px;
          height: 26px;
          border-radius: 7px;
          display: grid;
          place-items: center;
          color: var(--muted);
          background: transparent;
          border: 1px solid transparent;
          opacity: 0.65;
          transition: opacity 0.18s, color 0.18s, background 0.18s, border-color 0.18s;
        }
        .habit-card:hover .edit-habit-btn,
        .habit-card:hover .delete-habit-btn,
        .edit-habit-btn:focus-visible,
        .delete-habit-btn:focus-visible {
          opacity: 1;
        }
        .edit-habit-btn:hover {
          color: var(--accent-2);
          background: color-mix(in srgb, var(--accent) 14%, transparent);
          border-color: color-mix(in srgb, var(--accent) 30%, transparent);
        }
        .delete-habit-btn:hover {
          color: var(--danger-ink);
          background: var(--danger-bg);
          border-color: var(--danger-border);
        }
        .delete-confirm-btn {
          padding: 0.28rem 0.55rem;
          border-radius: 7px;
          background: var(--danger-bg);
          border: 1px solid var(--danger-border);
          color: var(--danger-ink);
          font-size: 0.72rem;
          font-weight: 600;
        }
        .token-count {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.76rem;
          color: var(--muted);
          font-variant-numeric: tabular-nums;
        }
        .token-count svg {
          color: var(--freeze-ink);
        }
        .use-token-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.34rem 0.72rem;
          border-radius: 8px;
          background: var(--freeze-bg);
          border: 1px solid var(--freeze-border);
          color: var(--freeze-ink);
          font-size: 0.76rem;
          font-weight: 600;
          white-space: nowrap;
          transition: opacity 0.18s, filter 0.18s;
        }
        .use-token-btn:hover:not(:disabled) {
          filter: brightness(1.08);
        }
        .use-token-btn:disabled {
          opacity: 0.42;
          cursor: not-allowed;
        }
        .frozen-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.3rem 0.65rem;
          border-radius: 8px;
          background: var(--freeze-bg);
          border: 1px solid var(--freeze-border);
          color: var(--freeze-ink);
          font-size: 0.74rem;
          font-weight: 600;
        }
        .reminder-chip-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.3rem 0.58rem;
          border-radius: 8px;
          background: var(--surface-subtle);
          border: 1px solid var(--border);
          color: var(--muted);
          font-size: 0.73rem;
          font-weight: 600;
          white-space: nowrap;
          font-variant-numeric: tabular-nums;
          transition: background 0.18s, border-color 0.18s, color 0.18s;
        }
        .reminder-chip-btn:hover {
          color: var(--text);
          border-color: color-mix(in srgb, var(--accent) 45%, transparent);
          background: var(--surface-hover);
        }
        .reminder-chip-btn.active {
          color: var(--accent-2);
          background: color-mix(in srgb, var(--accent) 16%, transparent);
          border-color: color-mix(in srgb, var(--accent) 45%, transparent);
        }
        .reminder-picker-row {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.55rem 1.25rem;
          border-top: 1px solid var(--border);
          background: var(--surface-subtle);
          flex-wrap: wrap;
        }
        .reminder-picker-label {
          font-size: 0.74rem;
          color: var(--muted);
          white-space: nowrap;
        }
        .reminder-picker-row input[type='time'] {
          flex: 1;
          min-width: 105px;
          background: var(--surface-input);
          border: 1px solid var(--border-strong);
          border-radius: 8px;
          padding: 0.28rem 0.5rem;
          color: var(--text);
          font-size: 0.78rem;
          color-scheme: var(--color-scheme);
          outline: none;
        }
        .reminder-picker-row input[type='time']:focus {
          border-color: color-mix(in srgb, var(--accent) 60%, transparent);
        }
        .reminder-save-btn {
          padding: 0.3rem 0.65rem;
          border-radius: 7px;
          background: var(--accent);
          color: var(--accent-contrast);
          font-size: 0.74rem;
          font-weight: 700;
          white-space: nowrap;
        }
        .reminder-off-btn,
        .reminder-cancel-btn {
          width: 26px;
          height: 26px;
          border-radius: 7px;
          display: grid;
          place-items: center;
          color: var(--muted);
          background: var(--surface-subtle);
          border: 1px solid var(--border);
        }
        .reminder-off-btn:hover {
          color: var(--danger-ink);
          border-color: var(--danger-border);
          background: var(--danger-bg);
        }
        .reminder-cancel-btn:hover {
          color: var(--text);
          background: var(--surface-hover);
        }
        .edit-reminder-row {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }
        .edit-reminder-row label {
          font-size: 0.72rem;
          color: var(--muted);
        }
        .edit-reminder-controls {
          display: flex;
          align-items: center;
          gap: 0.45rem;
        }
        .edit-reminder-controls input[type='time'] {
          flex: 1;
          color-scheme: var(--color-scheme);
        }
        .edit-clear-time {
          padding: 0.36rem 0.6rem;
          border-radius: 8px;
          background: var(--surface-subtle);
          color: var(--muted);
          font-size: 0.74rem;
        }
        .edit-clear-time:hover {
          color: var(--text);
        }
        .habit-notes-section {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 0.65rem 1.25rem 0.95rem;
          border-top: 1px solid var(--border);
          margin-top: auto;
        }
        .habit-notes-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          max-height: 112px;
          overflow-y: auto;
        }
        .habit-notes-list li {
          font-size: 0.77rem;
          line-height: 1.35;
          color: var(--text);
          opacity: 0.9;
          padding: 0.36rem 0.6rem;
          border-radius: 8px;
          background: var(--surface-subtle);
          border: 1px solid var(--border);
          word-break: break-word;
        }
        .notes-expand-btn {
          align-self: flex-start;
          font-size: 0.72rem;
          color: var(--accent-2);
          opacity: 0.85;
        }
        .notes-expand-btn:hover {
          opacity: 1;
          text-decoration: underline;
        }
        .habit-note-form {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .habit-note-form input {
          flex: 1;
          min-width: 0;
          background: var(--surface-input);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 0.38rem 0.65rem;
          color: var(--text);
          font-size: 0.78rem;
          outline: none;
          transition: border-color 0.18s;
        }
        .habit-note-form input::placeholder {
          color: var(--muted);
          opacity: 0.75;
        }
        .habit-note-form input:focus {
          border-color: color-mix(in srgb, var(--accent) 55%, transparent);
        }
        .note-submit-btn {
          width: 28px;
          height: 28px;
          flex-shrink: 0;
          border-radius: 8px;
          display: grid;
          place-items: center;
          background: color-mix(in srgb, var(--accent) 20%, transparent);
          border: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
          color: var(--text);
          transition: background 0.18s, opacity 0.18s;
        }
        .note-submit-btn:hover:not(:disabled) {
          background: color-mix(in srgb, var(--accent) 34%, transparent);
        }
        .note-submit-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .habit-tags-section {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 0.65rem 1.25rem;
          border-top: 1px solid var(--border);
        }
        .habit-tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
        }
        .habit-tag-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.18rem 0.35rem 0.18rem 0.52rem;
          border-radius: 7px;
          background: color-mix(in srgb, var(--cat-color) 11%, transparent);
          border: 1px solid color-mix(in srgb, var(--cat-color) 28%, transparent);
          font-size: 0.72rem;
          color: var(--cat-ink);
          transition: border-color 0.18s, background 0.18s, color 0.18s;
        }
        .habit-tag-chip:hover,
        .habit-tag-chip.selected {
          background: color-mix(in srgb, var(--cat-color) 22%, transparent);
          border-color: var(--cat-color);
          color: var(--cat-ink);
        }
        .habit-tag-label {
          color: inherit;
          font-size: inherit;
          font-weight: 500;
          line-height: 1.2;
        }
        .habit-tag-remove {
          display: grid;
          place-items: center;
          width: 16px;
          height: 16px;
          border-radius: 4px;
          color: inherit;
          opacity: 0.72;
          transition: opacity 0.15s, background 0.15s;
        }
        .habit-tag-remove:hover {
          opacity: 1;
          background: var(--surface-hover);
        }
        .habit-tag-form {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          position: relative;
        }
        .tag-input-icon {
          color: var(--muted);
          opacity: 0.65;
          flex-shrink: 0;
        }
        .habit-tag-form input {
          flex: 1;
          min-width: 0;
          background: var(--surface-input);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 0.34rem 0.6rem;
          color: var(--text);
          font-size: 0.76rem;
          outline: none;
          transition: border-color 0.18s;
        }
        .habit-tag-form input::placeholder {
          color: var(--muted);
          opacity: 0.75;
        }
        .habit-tag-form input:focus {
          border-color: color-mix(in srgb, var(--accent) 55%, transparent);
        }
        .tag-submit-btn {
          width: 26px;
          height: 26px;
          flex-shrink: 0;
          border-radius: 7px;
          display: grid;
          place-items: center;
          background: var(--surface-subtle);
          border: 1px solid var(--border-strong);
          color: var(--text);
          transition: background 0.18s, border-color 0.18s, opacity 0.18s;
        }
        .tag-submit-btn:hover:not(:disabled) {
          background: color-mix(in srgb, var(--accent) 22%, transparent);
          border-color: color-mix(in srgb, var(--accent) 45%, transparent);
        }
        .tag-submit-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .tag-filter-bar {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          flex-wrap: wrap;
        }
        .tag-filter-heading {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--muted);
        }
        .tag-filter-tabs {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          flex-wrap: wrap;
        }
        .tag-filter-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.3rem 0.68rem;
          border-radius: 8px;
          background: var(--surface-card);
          border: 1px solid var(--border);
          color: var(--muted);
          font-size: 0.76rem;
          font-weight: 500;
          white-space: nowrap;
          transition: color 0.18s, border-color 0.18s, background 0.18s;
        }
        .tag-filter-btn.color-tinted {
          background: color-mix(in srgb, var(--tag-color) 9%, transparent);
          border-color: color-mix(in srgb, var(--tag-color) 24%, transparent);
          color: var(--tag-ink);
        }
        .tag-filter-btn:hover {
          color: var(--text);
          border-color: color-mix(in srgb, var(--accent) 38%, transparent);
        }
        .tag-filter-btn.color-tinted:hover {
          color: var(--tag-ink);
          background: color-mix(in srgb, var(--tag-color) 16%, transparent);
          border-color: color-mix(in srgb, var(--tag-color) 46%, transparent);
        }
        .tag-filter-btn.active {
          color: var(--text);
          background: color-mix(in srgb, var(--accent) 20%, transparent);
          border-color: color-mix(in srgb, var(--accent) 50%, transparent);
          font-weight: 600;
        }
        .tag-filter-btn.color-tinted.active {
          color: var(--tag-ink);
          background: color-mix(in srgb, var(--tag-color) 22%, transparent);
          border-color: var(--tag-color);
          font-weight: 600;
        }
        .empty-state {
          padding: 2rem;
          text-align: center;
          border-radius: 18px;
          background: var(--surface-card);
          border: 1px dashed var(--border-strong);
          color: var(--muted);
          font-size: 0.9rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }
        .clear-filters-btn {
          padding: 0.42rem 0.85rem;
          border-radius: 9px;
          background: color-mix(in srgb, var(--accent) 18%, transparent);
          border: 1px solid color-mix(in srgb, var(--accent) 42%, transparent);
          color: var(--accent-2);
          font-size: 0.8rem;
          font-weight: 600;
        }
      `}</style>
    </div>
  )
}
