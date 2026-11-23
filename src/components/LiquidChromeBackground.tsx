import { useEffect, useRef } from 'react'

/** Premium liquid chrome-style animated background (canvas). 
 *  Replace with real <LiquidChrome /> from react-bits later. */
export function LiquidChromeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let t = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      t += 0.008
      const w = window.innerWidth
      const h = window.innerHeight
      ctx.fillStyle = '#060010'
      ctx.fillRect(0, 0, w, h)

      // soft liquid ribbons
      for (let i = 0; i < 5; i++) {
        const yBase = h * (0.15 + i * 0.18)
        ctx.beginPath()
        ctx.moveTo(0, yBase)
        for (let x = 0; x <= w; x += 8) {
          const y =
            yBase +
            Math.sin(x * 0.004 + t * (1.2 + i * 0.15) + i) * (28 + i * 8) +
            Math.sin(x * 0.008 - t * 0.7 + i * 2) * 14
          ctx.lineTo(x, y)
        }
        const grad = ctx.createLinearGradient(0, yBase - 40, 0, yBase + 40)
        const alpha = 0.07 + i * 0.02
        grad.addColorStop(0, `rgba(167,139,250,0)`)
        grad.addColorStop(0.4, `rgba(196,181,253,${alpha})`)
        grad.addColorStop(0.6, `rgba(244,114,182,${alpha * 0.7})`)
        grad.addColorStop(1, `rgba(167,139,250,0)`)
        ctx.strokeStyle = grad
        ctx.lineWidth = 48 + i * 12
        ctx.lineCap = 'round'
        ctx.stroke()
      }

      // subtle vignette
      const vg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7)
      vg.addColorStop(0, 'rgba(6,0,16,0)')
      vg.addColorStop(1, 'rgba(6,0,16,0.55)')
      ctx.fillStyle = vg
      ctx.fillRect(0, 0, w, h)

      raf = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
      aria-hidden
    />
  )
}
