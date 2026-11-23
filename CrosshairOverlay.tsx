import { useEffect, useState, RefObject } from 'react'

/** Subtle Crosshair-inspired cursor effect. Replace with real component later. */
export function CrosshairOverlay({ containerRef }: { containerRef: RefObject<HTMLDivElement | null> }) {
  const [pos, setPos] = useState({ x: -100, y: -100 })
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY })
      setVisible(true)
    }
    const onLeave = () => setVisible(false)

    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [containerRef])

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 40,
        mixBlendMode: 'difference',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: pos.x,
          top: 0,
          width: 1,
          height: '100%',
          background: 'rgba(255,255,255,0.25)',
          transform: 'translateX(-0.5px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: pos.y,
          left: 0,
          height: 1,
          width: '100%',
          background: 'rgba(255,255,255,0.25)',
          transform: 'translateY(-0.5px)',
        }}
      />
    </div>
  )
}
