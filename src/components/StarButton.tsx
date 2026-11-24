import { type ReactNode } from 'react'
import StarBorder from './StarBorder.jsx'

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
    <StarBorder
      as="button"
      onClick={onClick}
      className={className}
      color="#a78bfa"
      trailColor="#f0abfc"
      duration={4}
      thickness={1.5}
      radius={999}
      stars={2}
      glow={0.75}
      sparkle
      hover="lap"
      clickPulse
      theme="dark"
      backgroundColor="#0c0618"
      textColor="#f4f0ff"
      borderColor="rgba(167, 139, 250, 0.3)"
      style={{
        padding: '0.55rem 1.15rem',
        fontSize: '0.875rem',
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </StarBorder>
  )
}
