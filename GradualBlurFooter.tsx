/** GradualBlur-inspired bottom fade. Replace with real component later. */
export function GradualBlurFooter() {
  return (
    <div
      style={{
        position: 'relative',
        height: 80,
        marginTop: -40,
        pointerEvents: 'none',
        zIndex: 1,
        background: 'linear-gradient(to top, #060010 20%, transparent)',
      }}
    />
  )
}
