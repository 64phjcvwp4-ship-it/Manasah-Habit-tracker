import LiquidChrome from './LiquidChrome.jsx'

export function LiquidChromeBackground() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      <LiquidChrome
        color="#ffffff"
        speed={0.2}
        amplitude={0.3}
        detail={4}
        thickness={1}
        interactive
        frequencyX={3}
        frequencyY={3}
        depth={1}
        roughness={0.3}
        exposure={1}
        rippleStrength={1}
        rippleSize={1}
        tilt={1}
        intro
        lightMode={false}
        style={undefined}
      />
    </div>
  )
}
