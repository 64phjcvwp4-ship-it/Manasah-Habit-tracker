import { useState, useRef, useEffect } from 'react'
import { generateHabitCoachReply } from '../lib/habitCoach'
import type { Habit } from '../lib/habits'
import { useAuth } from '../contexts/AuthContext'
import { Send, X, Sparkles, RotateCcw } from 'lucide-react'
import Strands from './Strands.jsx'

interface ChatMessage {
  role: 'user' | 'ai'
  text: string
  isError?: boolean
}

const WELCOME_MESSAGE: ChatMessage = {
  role: 'ai',
  text: "Hey, I'm Maloxie. Ask me about your habits, streaks, tags, or reminders—everything runs right off your live tracker data.",
}

const QUICK_PROMPTS = [
  'Review my week',
  'Protect my streaks',
  'Where am I slipping?',
  'What to focus on today?',
]

function loadChatHistory(storageKey: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(storageKey)
    if (raw) {
      const parsed = JSON.parse(raw) as unknown
      if (Array.isArray(parsed) && parsed.length > 0) {
        const clean = parsed
          .filter((m): m is ChatMessage => Boolean(m && typeof m === 'object' && typeof m.text === 'string'))
          .map(m => ({
            role: (m.role === 'user' ? 'user' : 'ai') as 'user' | 'ai',
            text: m.text,
          }))
          .slice(-30)
        if (clean.length > 0) return clean
      }
    }
  } catch {
    // ignore corrupted chat history
  }
  return [WELCOME_MESSAGE]
}

export function CrystalBall({
  open,
  onClose,
  onOpen,
  habits,
}: {
  open: boolean
  onClose: () => void
  onOpen?: () => void
  habits: Habit[]
}) {
  const { user } = useAuth()
  const storageKey = `maloxie-chat-${user?.uid || 'guest'}`
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadChatHistory(storageKey))
  const [input, setInput] = useState('')
  const [listening, setListening] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMessages(loadChatHistory(storageKey))
  }, [storageKey])

  useEffect(() => {
    try {
      const toStore = messages.filter(m => !m.isError).slice(-30)
      localStorage.setItem(storageKey, JSON.stringify(toStore))
    } catch {
      // ignore storage failures
    }
  }, [messages, storageKey])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, listening])

  const sendMessage = async (rawText: string) => {
    const userMsg = rawText.trim()
    if (!userMsg || listening) return

    setInput('')
    setMessages(m => [...m, { role: 'user', text: userMsg }])
    setListening(true)

    await new Promise(resolve => setTimeout(resolve, 220))
    const replyText = generateHabitCoachReply(userMsg, habits)
    setMessages(m => [...m, { role: 'ai', text: replyText }])
    setListening(false)
  }

  const clearChat = () => {
    setMessages([WELCOME_MESSAGE])
    try {
      localStorage.removeItem(storageKey)
    } catch {
      // ignore
    }
  }

  return (
    <div className="crystal-wrap">
      {/* Strands AI orb */}
      <div
        className="orb-shell"
        onClick={() => (open ? onClose() : onOpen?.())}
        role="button"
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            open ? onClose() : onOpen?.()
          }
        }}
        aria-label={open ? 'Close Maloxie AI chat' : 'Open Maloxie AI chat'}
      >
        <div style={{ width: 220, height: 220, position: 'relative' }}>
          <Strands
            listening={listening}
            level={undefined}
            glass
            energy={0.65}
            colors={['#d95b56', '#ba5046', '#ffa24c', '#ffe0b3', '#93f1ff', '#3569fa', '#193d9b']}
            interactive
            clickPulse
            intro
            style={undefined}
          />
        </div>
        <div className="orb-label">
          <Sparkles size={14} />
          Maloxie Coach
        </div>
      </div>

      {/* Chat panel */}
      <div className={`chat-panel glass ${open ? 'open' : ''}`}>
        <div className="chat-head">
          <span>Maloxie Habit Coach</span>
          <div className="chat-head-actions">
            <button
              type="button"
              onClick={clearChat}
              aria-label="Reset conversation"
              title="Reset conversation"
            >
              <RotateCcw size={15} />
            </button>
            <button type="button" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="chat-body">
          {messages.map((m, i) => (
            <div key={i} className={`bubble ${m.role} ${m.isError ? 'error' : ''}`}>
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
        <div className="chat-quick-prompts">
          {QUICK_PROMPTS.map(prompt => (
            <button
              key={prompt}
              type="button"
              className="quick-prompt-btn"
              disabled={listening}
              onClick={() => void sendMessage(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>
        <div className="chat-input">
          <input
            value={input}
            maxLength={1000}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && void sendMessage(input)}
            placeholder="Ask about your habits…"
          />
          <button type="button" onClick={() => void sendMessage(input)} disabled={!input.trim() || listening}>
            <Send size={16} />
          </button>
        </div>
      </div>

      {!open && (
        <p className="orb-hint">Click “Ask Maloxie” in the nav or the orb to open chat</p>
      )}

      <style>{`
        .crystal-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          position: relative;
        }
        .orb-shell {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          outline: none;
        }
        .orb-label {
          margin-top: -10px;
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.8rem;
          color: var(--muted);
        }
        .orb-hint {
          font-size: 0.85rem;
          color: var(--muted);
          margin-top: 0.25rem;
        }

        .chat-panel {
          width: 100%;
          max-width: 500px;
          height: 0;
          overflow: hidden;
          opacity: 0;
          transition: height 0.4s cubic-bezier(0.22,1,0.36,1), opacity 0.3s;
          display: flex;
          flex-direction: column;
        }
        .chat-panel.open {
          height: 450px;
          opacity: 1;
          margin-top: 0.5rem;
        }
        .chat-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.9rem 1.1rem;
          border-bottom: 1px solid var(--border);
          font-weight: 600;
        }
        .chat-head-actions {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        .chat-head button {
          color: var(--muted);
          padding: 5px;
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
          line-height: 1.48;
          white-space: pre-wrap;
        }
        .bubble.user {
          align-self: flex-end;
          background: rgba(167, 139, 250, 0.22);
          border: 1px solid rgba(167, 139, 250, 0.35);
        }
        .bubble.ai {
          align-self: flex-start;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid var(--border);
        }
        .bubble.ai.error {
          background: rgba(248, 113, 113, 0.14);
          border-color: rgba(248, 113, 113, 0.35);
          color: #fecaca;
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
        .chat-quick-prompts {
          display: flex;
          gap: 0.4rem;
          padding: 0.45rem 1rem 0.15rem;
          flex-wrap: wrap;
        }
        .quick-prompt-btn {
          padding: 0.28rem 0.6rem;
          border-radius: 8px;
          background: rgba(167, 139, 250, 0.12);
          border: 1px solid rgba(167, 139, 250, 0.25);
          color: var(--accent-2);
          font-size: 0.75rem;
          font-weight: 500;
          transition: background 0.18s;
        }
        .quick-prompt-btn:hover:not(:disabled) {
          background: rgba(167, 139, 250, 0.22);
        }
        .chat-input {
          display: flex;
          gap: 0.5rem;
          padding: 0.65rem 1rem 1rem;
          border-top: 1px solid var(--border);
        }
        .chat-input input {
          flex: 1;
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 0.65rem 1rem;
          color: var(--text);
          font-size: 0.9rem;
          outline: none;
        }
        .chat-input input::placeholder {
          color: var(--muted);
          opacity: 0.75;
        }
        .chat-input input:focus {
          border-color: rgba(167, 139, 250, 0.5);
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
