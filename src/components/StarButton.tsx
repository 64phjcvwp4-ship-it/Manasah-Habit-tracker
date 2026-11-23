import { ReactNode } from 'react'

/** StarBorder-inspired CTA. Replace with real <StarBorder> later. */
export function StarButton({
  children,
  onClick,
  className = '',
}: {
  children: ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <button className={`star-btn ${className}`} onClick={onClick}>
      <span className="star-btn__inner">{children}</span>
      <style>{`
        .star-btn {
          position: relative;
          display: inline-flex;
          padding: 2px;
          border-radius: 999px;
          background: linear-gradient(90deg, #a78bfa, #f0abfc, #34d399, #a78bfa);
          background-size: 300% 100%;
          animation: borderShift 4s linear infinite;
          cursor: pointer;
          border: none;
        }
        .star-btn__inner {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.5rem 1.1rem;
          border-radius: 999px;
          background: #0c0618;
          color: #f4f0ff;
          font-size: 0.875rem;
          font-weight: 600;
          transition: background 0.2s;
        }
        .star-btn:hover .star-btn__inner {
          background: #120a22;
        }
        @keyframes borderShift {
          0% { background-position: 0% 50%; }
          100% { background-position: 300% 50%; }
        }
      `}</style>
    </button>
  )
}
