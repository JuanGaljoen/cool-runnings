'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  Tag,
  BarChart2,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { signOut } from '@/app/login/actions'

type NavItem = {
  href: string
  label: string
  icon: React.ElementType
  exact?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/stock', label: 'Stock', icon: Package },
  { href: '/dashboard/products', label: 'Products', icon: Tag },
  { href: '/dashboard/reports', label: 'Reports', icon: BarChart2 },
]

const ADMIN_NAV_ITEMS: NavItem[] = [
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

interface DashboardSidebarProps {
  fullName: string | null
  email: string
  isAdmin: boolean
}

function NavLink({ item, pathname, onClick }: { item: NavItem; pathname: string; onClick?: () => void }) {
  const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {item.label}
    </Link>
  )
}

function SidebarContent({
  fullName,
  email,
  isAdmin,
  pathname,
  onNavClick,
}: DashboardSidebarProps & { pathname: string; onNavClick?: () => void }) {
  const items = isAdmin ? [...NAV_ITEMS, ...ADMIN_NAV_ITEMS] : NAV_ITEMS

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex h-14 items-center border-b px-4">
        <span className="font-bold tracking-tight">Cool Runnings</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} onClick={onNavClick} />
        ))}
      </nav>

      {/* User + sign out */}
      <div className="border-t p-3 space-y-1">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{fullName || 'User'}</p>
            <p className="text-xs text-muted-foreground truncate">{email}</p>
          </div>
          <ThemeToggle />
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </form>
      </div>
    </div>
  )
}

export function DashboardSidebar({ fullName, email, isAdmin }: DashboardSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b bg-background px-4 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="font-bold tracking-tight">Cool Runnings</span>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          role="presentation"
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
          onKeyDown={(e) => e.key === 'Escape' && setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-60 border-r bg-background transition-transform duration-200 md:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="absolute right-2 top-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <SidebarContent
          fullName={fullName}
          email={email}
          isAdmin={isAdmin}
          pathname={pathname}
          onNavClick={() => setMobileOpen(false)}
        />
      </aside>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r bg-background md:flex md:flex-col">
        <SidebarContent
          fullName={fullName}
          email={email}
          isAdmin={isAdmin}
          pathname={pathname}
        />
      </aside>
    </>
  )
}
