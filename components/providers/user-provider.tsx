'use client'

import { createContext, useContext } from 'react'
import type { Enums } from '@/types/database'

export type UserProfile = {
  id: string
  full_name: string | null
  role: Enums<'user_role'>
}

type UserContextValue = {
  profile: UserProfile | null
}

const UserContext = createContext<UserContextValue | null>(null)

export function UserProvider({
  profile,
  children,
}: {
  profile: UserProfile | null
  children: React.ReactNode
}) {
  return (
    <UserContext.Provider value={{ profile }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used inside <UserProvider>')
  return ctx
}
