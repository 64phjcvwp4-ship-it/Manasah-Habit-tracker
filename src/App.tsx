import { useState, useRef } from 'react'
import { PrismBackground } from './components/PrismBackground'
import { MoxieLogo, USER_LOGO_SRC } from './components/MoxieLogo'
import { GlassSlabLogo } from './components/glass-slab-logo'
import { CrystalBall } from './components/CrystalBall'
import { HabitBoard } from './components/HabitBoard'
import { ProgressGallery } from './components/ProgressGallery'
import { StarButton } from './components/StarButton'
import { AnimatedSection } from './components/AnimatedSection'
import { CrosshairOverlay } from './components/CrosshairOverlay'
import { GradualBlurFooter } from './components/GradualBlurFooter'
import { MilestoneModal, type MilestoneEvent } from './components/MilestoneModal'
import { ReminderToast } from './components/ReminderToast'
import { AccountMenu } from './components/AccountMenu'
import { SettingsMenu } from './components/SettingsMenu'
import { PWAInstallButton } from './components/PWAInstallButton'
import { OfflineIndicator } from './components/OfflineIndicator'
import { useAuth } from './contexts/AuthContext'
import { useTheme } from './contexts/ThemeContext'
import { useHabits } from './hooks/useHabits'
import { useHabitReminders } from './hooks/useHabitReminders'
import { VALIDATION_LIMITS } from './firebase'
import { HABIT_CATEGORIES, normalizeReminderTime, type Habit, type HabitCategory } from './lib/habits'
import { Bell, Plus, Sparkles, Target, Flame, MessageCircle, Cloud, X } from 'lucide-react'
import './App.css'

export { HABIT_CATEGORIES, type Habit, type HabitCategory }

const STREAK_MILESTONES = new Set([3, 7, 14, 21, 30, 50, 66, 100, 365])

export default function App() {
  const { user, authReady, signingIn, authError, clearAuthError, signInWithGoogle } = useAuth()
  const { theme } = useTheme()
  const {
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
  } = useHabits()

  const [showAI, setShowAI] = useState(false)
  const [addingHabit, setAddingHabit] = useState(false)
  const [newHabitName, setNewHabitName] = useState('')
  const [newHabitCategory, setNewHabitCategory] = useState<HabitCategory>('Focus')
  const [newHabitTags, setNewHabitTags] = useState('')
  const [newHabitReminder, setNewHabitReminder] = useState('')
  const [celebration, setCelebration] = useState<MilestoneEvent | null>(null)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const celebratedRef = useRef<Set<string>>(new Set())
  const containerRef = useRef<HTMLDivElement>(null)

  const handleToggleHabit = async (id: string) => {
    const updatedHabit = await toggleHabit(id)
    if (!updatedHabit) return

    const milestoneKey = `${id}:${updatedHabit.streak}`
    if (
      updatedHabit.completedToday &&
      STREAK_MILESTONES.has(updatedHabit.streak) &&
      !celebratedRef.current.has(milestoneKey)
    ) {
      celebratedRef.current.add(milestoneKey)
      setCelebration({ habit: updatedHabit, milestone: updatedHabit.streak })
    }
  }

  const {
    permission: notificationPermission,
    alerts: reminderAlerts,
    swReady,
    backgroundSyncActive,
    requestPermission: requestNotificationPermission,
    dismissAlert: dismissReminderAlert,
    sendTestNotification,
  } = useHabitReminders(habits, handleToggleHabit)

  const handleSetHabitReminder = async (id: string, reminderTime: string) => {
    if (reminderTime && notificationPermission === 'default') {
      void requestNotificationPermission()
    }
    await setHabitReminder(id, reminderTime)
  }

  const handleEditHabit = async (
    id: string,
    updates: { name: string; category: HabitCategory; color: string; reminderTime?: string }
  ) => {
    if (updates.reminderTime && notificationPermission === 'default') {
      void requestNotificationPermission()
    }
    await editHabit(id, updates)
  }

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newHabitName.trim()) return
    const parsedTags = newHabitTags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)
    if (newHabitReminder && notificationPermission === 'default') {
      void requestNotificationPermission()
    }
    await createHabit(newHabitName, newHabitCategory, parsedTags, newHabitReminder)
    setNewHabitName('')
    setNewHabitTags('')
    setNewHabitReminder('')
    setAddingHabit(false)
  }

  const totalStreak = habits.reduce((s, h) => s + h.streak, 0)
  const doneToday = habits.filter(h => h.completedToday).length
  const scheduledRemindersCount = habits.filter(h => Boolean(normalizeReminderTime(h.reminderTime))).length

  return (
    <div className="app" ref={containerRef}>
      <PrismBackground />
      <CrosshairOverlay containerRef={containerRef} />

      {/* NAV */}
      <header className="nav">
        <div className="nav-inner section">
          <MoxieLogo />
          <nav className="nav-links">
            <a href="#habits">Habits</a>
            <a href="#progress">Progress</a>
            <a href="#ai">Coach</a>
          </nav>
          <div className="nav-actions">
            <PWAInstallButton />
            <SettingsMenu
              notificationPermission={notificationPermission}
              onRequestNotifications={() => void requestNotificationPermission()}
            />
            <AccountMenu
              habitCount={habits.length}
              totalStreak={totalStreak}
              isCloudMode={isCloudMode}
            />
            <StarButton onClick={() => setShowAI(true)}>
              <MessageCircle size={16} />
              Ask Maloxie
            </StarButton>
          </div>
        </div>
      </header>

      {authError && (
        <div className="section">
          <div className="auth-error-banner" role="alert">
            <span>{authError}</span>
            <button type="button" onClick={clearAuthError} aria-label="Dismiss error">
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* HERO */}
      <section className="hero section">
        <AnimatedSection>
          <div
            style={{
              width: 184,
              height: 184,
              margin: '0 auto 1.35rem',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <GlassSlabLogo
              logo={USER_LOGO_SRC}
              colorPreset="oilDark"
              slabs={17}
              depth={0.75}
              elevation={60}
              colors={
                theme === 'light'
                  ? ['#6d28d9', '#4c1d95', '#3b0764', '#2e1065', '#1e1b4b']
                  : ['#2b1e4a', '#141418', '#0d0d10', '#08080b', '#050507']
              }
              oilFinish="dark"
              density={1.65}
              reflectivity={1.65}
              ambient={theme === 'light' ? 0.24 : 0.08}
              exposure={theme === 'light' ? 0.95 : 0.85}
              logoScale={0.92}
              backgroundColor="transparent"
              height={180}
              style={{ width: 180, height: 180 }}
              aria-label="Maloxie glass slab logo"
            />
          </div>
          <div className="hero-badge">
            <Sparkles size={14} />
            Smart habit coach
          </div>
          <h1>
            Build habits that<br />
            <span className="gradient-text">actually stick</span>
          </h1>
          <p className="hero-sub">
            Maloxie turns consistency into a daily ritual. Track, reflect, and get instant insights from your personal habit coach.
          </p>
          <div className="hero-stats">
            <div className="stat">
              <Flame size={18} />
              <div>
                <strong>{totalStreak}</strong>
                <span>total streak days</span>
              </div>
            </div>
            <div className="stat">
              <Target size={18} />
              <div>
                <strong>{doneToday}/{habits.length}</strong>
                <span>done today</span>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* HABITS */}
      <section id="habits" className="section habits-section">
        <AnimatedSection>
          <div className="section-header">
            <div className="section-title-group">
              <h2>Today’s habits</h2>
              {isCloudMode && (
                <span className="cloud-pill">
                  <Cloud size={12} />
                  Synced to account
                </span>
              )}
            </div>
            <button className="add-btn" onClick={() => setAddingHabit(v => !v)}>
              <Plus size={18} />
              {addingHabit ? 'Close' : 'Add habit'}
            </button>
          </div>

          {authReady && !user && !bannerDismissed && (
            <div className="sync-banner glass">
              <div className="sync-banner-copy">
                <Cloud size={17} />
                <div>
                  <strong>Save your progress across devices</strong>
                  <span>Sign in with Google to back up your habits, freeze tokens, and daily notes to your account.</span>
                </div>
              </div>
              <div className="sync-banner-actions">
                <button
                  type="button"
                  className="sync-signin-btn"
                  onClick={() => void signInWithGoogle()}
                  disabled={signingIn}
                >
                  {signingIn ? 'Signing in…' : 'Sign in with Google'}
                </button>
                <button
                  type="button"
                  className="sync-dismiss-btn"
                  onClick={() => setBannerDismissed(true)}
                  aria-label="Dismiss sign-in prompt"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          )}

          {addingHabit && (
            <form className="add-habit-form glass" onSubmit={e => void handleCreateHabit(e)}>
              <input
                type="text"
                value={newHabitName}
                maxLength={VALIDATION_LIMITS.MAX_HABIT_NAME_LENGTH}
                onChange={e => setNewHabitName(e.target.value)}
                placeholder="Habit name (e.g. Read 20 pages)"
                aria-label="New habit name"
                autoFocus
              />
              <select
                value={newHabitCategory}
                onChange={e => setNewHabitCategory(e.target.value as HabitCategory)}
                aria-label="Habit category"
              >
                {HABIT_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={newHabitTags}
                maxLength={120}
                onChange={e => setNewHabitTags(e.target.value)}
                placeholder="Tags (comma-separated, optional)"
                aria-label="Initial habit tags"
              />
              <label className="add-reminder-field">
                <span>Reminder</span>
                <input
                  type="time"
                  value={newHabitReminder}
                  onChange={e => setNewHabitReminder(e.target.value)}
                  aria-label="Daily reminder time (optional)"
                />
              </label>
              <button type="submit" className="add-submit-btn" disabled={!newHabitName.trim()}>
                Create
              </button>
            </form>
          )}

          <div className="reminders-bar glass" aria-label="Daily browser notifications">
            <div className="reminders-bar-info">
              <Bell size={15} />
              <div className="reminders-bar-text">
                <span className="reminders-count">
                  {scheduledRemindersCount === 0
                    ? 'No daily reminders set'
                    : `${scheduledRemindersCount} daily ${scheduledRemindersCount === 1 ? 'reminder' : 'reminders'} scheduled`}
                </span>
                <span className="reminders-sep" aria-hidden="true">·</span>
                <span className="reminders-perm">
                  {notificationPermission === 'granted'
                    ? backgroundSyncActive
                      ? 'Background & Service Worker alerts active'
                      : swReady
                        ? 'Service Worker notifications active'
                        : 'Browser notifications enabled'
                    : notificationPermission === 'denied'
                      ? 'Browser notifications blocked (in-app alerts active)'
                      : notificationPermission === 'unsupported'
                        ? 'In-app alerts active'
                        : 'Click Remind on any habit to set a time'}
                </span>
              </div>
            </div>
            <div className="reminders-bar-actions">
              {notificationPermission === 'default' && (
                <button
                  type="button"
                  className="reminder-enable-btn"
                  onClick={() => void requestNotificationPermission()}
                >
                  Enable browser alerts
                </button>
              )}
              <button
                type="button"
                className="reminder-test-btn"
                onClick={() => void sendTestNotification()}
              >
                Test alert
              </button>
            </div>
          </div>

          {cloudLoading && habits.length === 0 ? (
            <div className="cloud-loading-state">Loading your account habits…</div>
          ) : (
            <HabitBoard
              habits={habits}
              onToggle={id => void handleToggleHabit(id)}
              onUseToken={id => void useStreakFreeze(id)}
              onAddNote={(id, note) => void addHabitNote(id, note)}
              onAddTag={(id, tag) => void addHabitTag(id, tag)}
              onRemoveTag={(id, tag) => void removeHabitTag(id, tag)}
              onSetReminder={(id, reminderTime) => void handleSetHabitReminder(id, reminderTime)}
              onEdit={(id, updates) => void handleEditHabit(id, updates)}
              onDelete={id => void deleteHabit(id)}
            />
          )}
        </AnimatedSection>
      </section>

      {/* PROGRESS GALLERY */}
      <section id="progress" className="section progress-section">
        <AnimatedSection>
          <h2>Your progress</h2>
          <p className="section-desc">A living gallery of consistency. Hover to expand.</p>
          <ProgressGallery habits={habits} />
        </AnimatedSection>
      </section>

      {/* AI CRYSTAL BALL */}
      <section id="ai" className="section ai-section">
        <AnimatedSection>
          <div className="ai-header">
            <h2>Talk to Maloxie</h2>
            <p className="section-desc">
              Your crystal ball for habit insight. Ask anything about your streaks, blockers, or how to level up.
            </p>
          </div>
          <CrystalBall open={showAI} onOpen={() => setShowAI(true)} onClose={() => setShowAI(false)} habits={habits} />
        </AnimatedSection>
      </section>

      {/* FOOTER */}
      <GradualBlurFooter />
      <footer className="footer section">
        <div className="footer-inner">
          <MoxieLogo small />
          <p>Built for people who ship. © {new Date().getFullYear()} Maloxie</p>
        </div>
      </footer>

      <MilestoneModal event={celebration} onClose={() => setCelebration(null)} />
      <ReminderToast
        alerts={reminderAlerts}
        onComplete={(habitId, alertKey) => {
          dismissReminderAlert(alertKey)
          const target = habits.find(h => h.id === habitId)
          if (target && !target.completedToday) {
            void handleToggleHabit(habitId)
          }
        }}
        onDismiss={dismissReminderAlert}
      />
      <OfflineIndicator />
    </div>
  )
}
