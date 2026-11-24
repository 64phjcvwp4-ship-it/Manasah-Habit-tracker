import { type ReactNode } from 'react'
import { useTheme } from '../contexts/ThemeContext'
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
  const { theme } = useTheme()
  const isLight = theme === 'light'

  return (
    <StarBorder
      as="button"
      onClick={onClick}
      className={className}
      color={isLight ? '#7c3aed' : '#a78bfa'}
      trailColor={isLight ? '#db2777' : '#f0abfc'}
      duration={4}
      thickness={1.5}
      radius={999}
      stars={2}
      glow={isLight ? 0.5 : 0.75}
      sparkle
      hover="lap"
      clickPulse
      theme={theme}
      backgroundColor={isLight ? '#ffffff' : '#0c0618'}
      textColor={isLight ? '#151024' : '#f4f0ff'}
      borderColor={isLight ? 'rgba(124, 58, 237, 0.35)' : 'rgba(167, 139, 250, 0.3)'}
      style={{
        padding: '0.52rem 1.05rem',
        fontSize: '0.86rem',
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </StarBorder>
  )
}
