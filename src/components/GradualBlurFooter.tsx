import GradualBlur from './GradualBlur.jsx'

export function GradualBlurFooter() {
  return (
    <GradualBlur
      position="bottom"
      target="page"
      height="5rem"
      width={undefined}
      strength={2}
      layers={6}
      curve="bezier"
      exponential
      opacity={1}
      tint="#060010"
      autoHide
      container={undefined}
      zIndex={35}
      style={undefined}
    />
  )
}
