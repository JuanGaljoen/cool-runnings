import type { Enums } from '@/types/database'

type MovementType = Enums<'movement_type'>

export const MOVEMENT_LABELS: Record<MovementType, string> = {
  production: 'Production',
  dispatch: 'Dispatch',
  adjustment: 'Adjustment',
}
