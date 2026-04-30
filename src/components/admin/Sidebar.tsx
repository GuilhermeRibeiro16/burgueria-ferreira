'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, Flame } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { NAV_ITEMS } from '@/constants'
import { cn } from '@/lib/utils'

export function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return (
    <aside
      className="fixed left-0 top-0 h-full w-[240px] flex flex-col border-r z-40"
      style={{
        width:           'var(--sidebar-width)',
        backgroundColor: 'var(--bg-card)',
        borderColor:     'var(--border)',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2 px-5 h-14 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <Flame size={22} style={{ color: 'var(--brand)' }} />
        <span className="font-bold text-sm tracking-wide" style={{ color: 'var(--text-primary)' }}>
          Burgueria Ferreira
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'text-white'
                  : 'hover:opacity-80'
              )}
              style={active ? {
                backgroundColor: 'var(--brand)',
                color: 'white',
              } : {
                color: 'var(--text-muted)',
              }}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-opacity hover:opacity-80"
          style={{ color: 'var(--text-muted)' }}
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  )
}