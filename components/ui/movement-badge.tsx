import type { Enums } from '@/types/database'
import { MOVEMENT_LABELS } from '@/lib/movement-constants'

type MovementType = Enums<'movement_type'>

const CLASS_MAP: Record<MovementType, string> = {
  production:
    'inline-flex items-center rounded-full bg-green-200 px-2.5 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-400',
  dispatch:
    'inline-flex items-center rounded-full bg-blue-200 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  adjustment:
    'inline-flex items-center rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
}

export function MovementBadge({ type }: { type: MovementType }) {
  return <span className={CLASS_MAP[type]}>{MOVEMENT_LABELS[type]}</span>
}
