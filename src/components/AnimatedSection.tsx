import { type ReactNode } from 'react'
import AnimatedContent from './AnimatedContent.jsx'

export function AnimatedSection({ children }: { children: ReactNode }) {
  return (
    <AnimatedContent
      container={undefined}
      distance={28}
      direction="vertical"
      duration={0.7}
      ease="power3.out"
      initialOpacity={0}
      animateOpacity
      threshold={0.12}
      once
      onStart={undefined}
      onComplete={undefined}
      onDisappearanceComplete={undefined}
      style={undefined}
    >
      {children}
    </AnimatedContent>
  )
}
