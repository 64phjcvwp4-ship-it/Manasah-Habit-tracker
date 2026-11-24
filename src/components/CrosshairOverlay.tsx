import { type RefObject } from 'react'
import Crosshair from './Crosshair.jsx'

export function CrosshairOverlay({ containerRef }: { containerRef: RefObject<HTMLDivElement | null> }) {
  return (
    <Crosshair
      containerRef={containerRef as unknown as null}
      color="#a78bfa"
      thickness={1}
      opacity={0.45}
      gap={6}
      fade={0.35}
      smoothing={0.35}
      showCoordinates={false}
      targetEffect="lock"
      clickPulse
      blendMode="screen"
      style={{ position: 'fixed', zIndex: 40 }}
    />
  )
}
