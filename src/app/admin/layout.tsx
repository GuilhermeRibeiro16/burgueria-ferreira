import { Sidebar }   from '@/components/admin/Sidebar'
import { BottomNav } from '@/components/admin/BottomNav'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="admin-layout">
      {/* Sidebar visível apenas no desktop */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Conteúdo principal */}
      <main className="page-content">
        {children}
      </main>

      {/* Bottom nav visível apenas no mobile */}
      <BottomNav />
    </div>
  )
}