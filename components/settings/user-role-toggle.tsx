'use client'

import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { updateUserRole } from '@/app/dashboard/settings/actions'
import type { Enums } from '@/types/database'

interface UserRoleToggleProps {
  userId: string
  currentRole: Enums<'user_role'>
  isSelf: boolean
}

export function UserRoleToggle({ userId, currentRole, isSelf }: UserRoleToggleProps) {
  const [role, setRole] = useState(currentRole)
  const [loading, setLoading] = useState(false)

  async function handleChange(value: string) {
    const newRole = value as Enums<'user_role'>
    setLoading(true)
    const { error } = await updateUserRole(userId, newRole)
    setLoading(false)

    if (error) {
      toast.error(error)
      return
    }

    setRole(newRole)
    toast.success('Role updated')
  }

  return (
    <Select
      value={role}
      onValueChange={handleChange}
      disabled={loading || isSelf}
    >
      <SelectTrigger className="w-28">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="admin">Admin</SelectItem>
        <SelectItem value="staff">Staff</SelectItem>
      </SelectContent>
    </Select>
  )
}
