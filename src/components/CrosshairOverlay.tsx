import { type RefObject } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import Crosshair from './Crosshair.jsx'

export function CrosshairOverlay({ containerRef }: { containerRef: RefObject<HTMLDivElement | null> }) {
  const { theme } = useTheme()
  const isLight = theme === 'light'

  return (
    <Crosshair
      containerRef={containerRef as unknown as null}
      color={isLight ? '#7c3aed' : '#a78bfa'}
      thickness={1}
      opacity={isLight ? 0.35 : 0.45}
      gap={6}
      fade={0.35}
      smoothing={0.35}
      showCoordinates={false}
      targetEffect="lock"
      clickPulse
      blendMode={isLight ? 'multiply' : 'screen'}
      style={{ position: 'fixed', zIndex: 40 }}
    />
  )
}
