import Prism from './Prism.jsx'

export function PrismBackground() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      <Prism
        animationType="rotate"
        timeScale={0.5}
        height={3.5}
        baseWidth={5.5}
        scale={3.6}
        hueShift={0}
        colorFrequency={1}
        glow={1}
        colors={[]}
        saturation={1.5}
        noise={0}
        offset={undefined}
        interactive
        hoverStrength={2}
        inertia={0.05}
        intro
        resolution={0.5}
        lightMode={false}
        dpr={undefined}
        style={undefined}
      />
    </div>
  )
}
