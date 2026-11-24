import {
  BookOpen,
  Brain,
  Code,
  Droplets,
  Dumbbell,
  Flame,
  Heart,
  Moon,
  Sparkles,
  Sun,
  Target,
  Timer,
} from 'lucide-react'
import type { HabitIconName } from '../types/habit'

export function HabitIcon({
  name,
  size = 16,
  color,
}: {
  name: HabitIconName
  size?: number
  color?: string
}) {
  const props = { size, style: color ? { color } : undefined }
  switch (name) {
    case 'Flame':
      return <Flame {...props} />
    case 'Brain':
      return <Brain {...props} />
    case 'Dumbbell':
      return <Dumbbell {...props} />
    case 'BookOpen':
      return <BookOpen {...props} />
    case 'Droplets':
      return <Droplets {...props} />
    case 'Moon':
      return <Moon {...props} />
    case 'Code':
      return <Code {...props} />
    case 'Heart':
      return <Heart {...props} />
    case 'Sun':
      return <Sun {...props} />
    case 'Timer':
      return <Timer {...props} />
    case 'Target':
      return <Target {...props} />
    case 'Sparkles':
    default:
      return <Sparkles {...props} />
  }
}
