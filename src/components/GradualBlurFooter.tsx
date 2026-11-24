import { useTheme } from '../contexts/ThemeContext'
import GradualBlur from './GradualBlur.jsx'

export function GradualBlurFooter() {
  const { theme } = useTheme()

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
      tint={theme === 'light' ? '#f6f4fb' : '#060010'}
      autoHide
      container={undefined}
      zIndex={35}
      style={undefined}
    />
  )
}
