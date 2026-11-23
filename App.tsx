import { useState, useEffect, useRef } from 'react'
import { LiquidChromeBackground } from './components/LiquidChromeBackground'
import { MoxieLogo } from './components/MoxieLogo'
import { CrystalBall } from './components/CrystalBall'
import { HabitBoard } from './components/HabitBoard'
import { ProgressGallery } from './components/ProgressGallery'
import { StarButton } from './components/StarButton'
import { AnimatedSection } from './components/AnimatedSection'
import { CrosshairOverlay } from './components/CrosshairOverlay'
import { GradualBlurFooter } from './components/GradualBlurFooter'
import { Plus, Sparkles, Target, Flame, MessageCircle } from 'lucide-react'
import './App.css'

export type Habit = {
  id: string
  name: string
  streak: number
  completedToday: boolean
  history: boolean[] // last 7 days
  color: string
}

const DEFAULT_HABITS: Habit[] = [
  { id: '1', name: 'Morning meditation', streak: 12, completedToday: false, history: [true, true, true, false, true, true, true], color: '#a78bfa' },
  { id: '2', name: 'Deep work block', streak: 5, completedToday: true, history: [true, true, false, true, true, true, true], color: '#34d399' },
  { id: '3', name: 'Evening journal', streak: 21, completedToday: false, history: [true, true, true, true, true, true, false], color: '#f472b6' },
  { id: '4', name: 'Move / train', streak: 8, completedToday: false, history: [true, false, true, true, true, true, true], color: '#fbbf24' },
]

function loadHabits(): Habit[] {
  try {
    const raw = localStorage.getItem('moxie-habits')
    if (raw) return JSON.parse(raw)
  } catch {}
  return DEFAULT_HABITS
}

function saveHabits(habits: Habit[]) {
  localStorage.setItem('moxie-habits', JSON.stringify(habits))
}

export default function App() {
  const [habits, setHabits] = useState<Habit[]>(() => loadHabits())
  const [showAI, setShowAI] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    saveHabits(habits)
  }, [habits])

  const toggleHabit = (id: string) => {
    setHabits(prev =>
      prev.map(h => {
        if (h.id !== id) return h
        const next = !h.completedToday
        const history = [...h.history]
        history[6] = next
        return {
          ...h,
          completedToday: next,
          streak: next ? h.streak + (h.history[5] ? 0 : 1) : Math.max(0, h.streak - 1),
          history,
        }
      })
    )
  }

  const addHabit = () => {
    const name = prompt('New habit name?')
    if (!name?.trim()) return
    const colors = ['#a78bfa', '#34d399', '#f472b6', '#fbbf24', '#60a5fa', '#fb923c']
    setHabits(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: name.trim(),
        streak: 0,
        completedToday: false,
        history: [false, false, false, false, false, false, false],
        color: colors[prev.length % colors.length],
      },
    ])
  }

  const totalStreak = habits.reduce((s, h) => s + h.streak, 0)
  const doneToday = habits.filter(h => h.completedToday).length

  return (
    <div className="app" ref={containerRef}>
      <LiquidChromeBackground />
      <CrosshairOverlay containerRef={containerRef} />

      {/* NAV */}
      <header className="nav">
        <div className="nav-inner section">
          <MoxieLogo />
          <nav className="nav-links">
            <a href="#habits">Habits</a>
            <a href="#progress">Progress</a>
            <a href="#ai">Moxie AI</a>
          </nav>
          <StarButton onClick={() => setShowAI(true)}>
            <MessageCircle size={16} />
            Ask Moxie
          </StarButton>
        </div>
      </header>

      {/* HERO */}
      <section className="hero section">
        <AnimatedSection>
          <div className="hero-badge">
            <Sparkles size={14} />
            AI-powered habit system
          </div>
          <h1>
            Build habits that<br />
            <span className="gradient-text">actually stick</span>
          </h1>
          <p className="hero-sub">
            Moxie turns consistency into a beautiful ritual. Track, reflect, and let your personal AI coach keep you sharp.
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
            <h2>Today’s habits</h2>
            <button className="add-btn" onClick={addHabit}>
              <Plus size={18} />
              Add habit
            </button>
          </div>
          <HabitBoard habits={habits} onToggle={toggleHabit} />
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
            <h2>Talk to Moxie</h2>
            <p className="section-desc">
              Your crystal ball for habit insight. Ask anything about your streaks, blockers, or how to level up.
            </p>
          </div>
          <CrystalBall open={showAI} onClose={() => setShowAI(false)} habits={habits} />
        </AnimatedSection>
      </section>

      {/* FOOTER */}
      <GradualBlurFooter />
      <footer className="footer section">
        <div className="footer-inner">
          <MoxieLogo small />
          <p>Built for people who ship. © {new Date().getFullYear()} Moxie</p>
        </div>
      </footer>
    </div>
  )
}
