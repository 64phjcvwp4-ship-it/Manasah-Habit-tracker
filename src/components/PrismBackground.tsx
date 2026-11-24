import Prism from './Prism.jsx'
import { useTheme } from '../contexts/ThemeContext'

export function PrismBackground() {
  const { theme } = useTheme()
  const isLight = theme === 'light'

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        opacity: isLight ? 0.24 : 1,
      }}
    >
      <Prism
        animationType="rotate"
        timeScale={0.5}
        height={3.5}
        baseWidth={5.5}
        scale={3.6}
        hueShift={0}
        colorFrequency={1}
        glow={isLight ? 0.85 : 1}
        colors={[]}
        saturation={isLight ? 1.15 : 1.5}
        noise={0}
        offset={undefined}
        interactive
        hoverStrength={2}
        inertia={0.05}
        intro
        resolution={0.5}
        lightMode={isLight}
        dpr={undefined}
        style={undefined}
      />
    </div>
  )
}
