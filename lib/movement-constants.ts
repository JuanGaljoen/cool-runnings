import type { Enums } from '@/types/database'

type MovementType = Enums<'movement_type'>

export const MOVEMENT_BADGE_STYLES: Record<MovementType, string> = {
  production: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  dispatch: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  adjustment: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
}

export const MOVEMENT_LABELS: Record<MovementType, string> = {
  production: 'Production',
  dispatch: 'Dispatch',
  adjustment: 'Adjustment',
}
