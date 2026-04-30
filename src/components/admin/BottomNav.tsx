'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV_ITEMS } from '@/constants'
import { cn } from '@/lib/utils'

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center border-t lg:hidden"
      style={{
        height:          'var(--nav-mobile-height)',
        backgroundColor: 'var(--bg-card)',
        borderColor:     'var(--border)',
      }}
    >
      {NAV_ITEMS.map((item) => {
        const active = pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-opacity hover:opacity-80"
            style={{ color: active ? 'var(--brand)' : 'var(--text-subtle)' }}
          >
            <item.icon size={20} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}