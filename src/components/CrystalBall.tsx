import { useState, useRef, useEffect } from 'react'
import type { Habit } from '../App'
import { Send, X, Sparkles } from 'lucide-react'

/** Strands / crystal-ball inspired AI orb + chat panel.
 *  Wire this to your free LLM API later. */
export function CrystalBall({
  open,
  onClose,
  habits,
}: {
  open: boolean
  onClose: () => void
  habits: Habit[]
}) {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    {
      role: 'ai',
      text: "Hey, I'm Moxie. Ask me about your habits, streaks, or how to stay consistent. What are you working on?",
    },
  ])
  const [input, setInput] = useState('')
  const [listening, setListening] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!input.trim()) return
    const userMsg = input.trim()
    setInput('')
    setMessages(m => [...m, { role: 'user', text: userMsg }])
    setListening(true)

    // Simulated response — replace with real free LLM call
    await new Promise(r => setTimeout(r, 900 + Math.random() * 600))
    const reply = generateReply(userMsg, habits)
    setMessages(m => [...m, { role: 'ai', text: reply }])
    setListening(false)
  }

  return (
    <div className="crystal-wrap">
      {/* Visual orb */}
      <div className={`orb ${listening ? 'pulse' : ''}`}>
        <div className="orb-core" />
        <div className="orb-ring r1" />
        <div className="orb-ring r2" />
        <div className="orb-ring r3" />
        <div className="orb-label">
          <Sparkles size={14} />
          Moxie AI
        </div>
      </div>

      {/* Chat panel */}
      <div className={`chat-panel glass ${open ? 'open' : ''}`}>
        <div className="chat-head">
          <span>Moxie AI</span>
          <button onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="chat-body">
          {messages.map((m, i) => (
            <div key={i} className={`bubble ${m.role}`}>
              {m.text}
            </div>
          ))}
          {listening && (
            <div className="bubble ai typing">
              <span /><span /><span />
            </div>
          )}
          <div ref={endRef} />
        </div>
        <div className="chat-input">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Ask about your habits…"
          />
          <button onClick={send} disabled={!input.trim() || listening}>
            <Send size={16} />
          </button>
        </div>
      </div>

      {!open && (
        <p className="orb-hint">Click “Ask Moxie” in the nav or the orb to open chat</p>
      )}

      <style>{`
        .crystal-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          position: relative;
        }
        .orb {
          width: 180px;
          height: 180px;
          position: relative;
          display: grid;
          place-items: center;
          cursor: pointer;
        }
        .orb-core {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 30%, #e9d5ff, #a78bfa 45%, #5b21b6 90%);
          box-shadow:
            0 0 40px rgba(167,139,250,0.55),
            0 0 80px rgba(167,139,250,0.25),
            inset 0 0 20px rgba(255,255,255,0.3);
          z-index: 2;
        }
        .orb.pulse .orb-core {
          animation: corePulse 1.2s ease-in-out infinite;
        }
        .orb-ring {
          position: absolute;
          border-radius: 50%;
          border: 1.5px solid rgba(196,181,253,0.25);
          animation: spin 12s linear infinite;
        }
        .r1 { width: 100px; height: 100px; animation-duration: 8s; }
        .r2 { width: 130px; height: 130px; animation-duration: 14s; animation-direction: reverse; border-color: rgba(244,114,182,0.2); }
        .r3 { width: 160px; height: 160px; animation-duration: 20s; border-style: dashed; border-color: rgba(167,139,250,0.15); }
        .orb-label {
          position: absolute;
          bottom: -28px;
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.8rem;
          color: var(--muted);
        }
        .orb-hint {
          font-size: 0.85rem;
          color: var(--muted);
          margin-top: 1.5rem;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes corePulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 40px rgba(167,139,250,0.55); }
          50% { transform: scale(1.08); box-shadow: 0 0 60px rgba(167,139,250,0.75); }
        }

        .chat-panel {
          width: 100%;
          max-width: 480px;
          height: 0;
          overflow: hidden;
          opacity: 0;
          transition: height 0.4s cubic-bezier(0.22,1,0.36,1), opacity 0.3s;
          display: flex;
          flex-direction: column;
        }
        .chat-panel.open {
          height: 420px;
          opacity: 1;
          margin-top: 1rem;
        }
        .chat-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.9rem 1.1rem;
          border-bottom: 1px solid var(--border);
          font-weight: 600;
        }
        .chat-head button {
          color: var(--muted);
          padding: 4px;
          border-radius: 6px;
        }
        .chat-head button:hover { color: var(--text); background: rgba(255,255,255,0.06); }
        .chat-body {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .bubble {
          max-width: 85%;
          padding: 0.7rem 1rem;
          border-radius: 16px;
          font-size: 0.9rem;
          line-height: 1.45;
        }
        .bubble.user {
          align-self: flex-end;
          background: rgba(167,139,250,0.25);
          border: 1px solid rgba(167,139,250,0.3);
        }
        .bubble.ai {
          align-self: flex-start;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .bubble.typing {
          display: flex;
          gap: 4px;
          padding: 0.85rem 1rem;
        }
        .bubble.typing span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent);
          animation: bounce 1s infinite ease-in-out;
        }
        .bubble.typing span:nth-child(2) { animation-delay: 0.15s; }
        .bubble.typing span:nth-child(3) { animation-delay: 0.3s; }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
        .chat-input {
          display: flex;
          gap: 0.5rem;
          padding: 0.75rem 1rem 1rem;
          border-top: 1px solid var(--border);
        }
        .chat-input input {
          flex: 1;
          background: rgba(0,0,0,0.3);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 0.65rem 1rem;
          color: var(--text);
          font-size: 0.9rem;
          outline: none;
        }
        .chat-input input:focus {
          border-color: rgba(167,139,250,0.5);
        }
        .chat-input button {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: var(--accent);
          color: #0a0014;
          display: grid;
          place-items: center;
          transition: opacity 0.2s;
        }
        .chat-input button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}

function generateReply(q: string, habits: Habit[]): string {
  const lower = q.toLowerCase()
  const total = habits.reduce((s, h) => s + h.streak, 0)
  const best = [...habits].sort((a, b) => b.streak - a.streak)[0]
  const pending = habits.filter(h => !h.completedToday)

  if (lower.includes('streak') || lower.includes('best')) {
    return best
      ? `Your strongest habit right now is “${best.name}” at ${best.streak} days. Across everything you’ve logged ${total} streak days. That’s real momentum.`
      : `You haven’t built a streak yet — pick one habit and protect it for the next 7 days.`
  }
  if (lower.includes('today') || lower.includes('left') || lower.includes('remaining')) {
    if (pending.length === 0) return `You’ve crushed everything for today. Rest or stack a bonus habit if you feel it.`
    return `Still open today: ${pending.map(h => h.name).join(', ')}. One at a time is enough.`
  }
  if (lower.includes('help') || lower.includes('stuck') || lower.includes('motivat')) {
    return `When motivation dips, shrink the habit. Do the 2-minute version. Showing up is the win — the intensity can return later.`
  }
  if (lower.includes('add') || lower.includes('new')) {
    return `New habits stick best when they’re attached to something you already do. After coffee → 5 minutes of X. Keep the bar ridiculously low at first.`
  }
  return `You’re tracking ${habits.length} habits with a combined ${total} streak days. Focus on the next small win rather than the whole week. What feels hardest right now?`
}
