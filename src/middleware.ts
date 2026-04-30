// Protege todas as rotas /admin/* exceto /admin/login
// Roda no Edge — antes de qualquer Server Component
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Verifica sessão ativa
  const { data: { user } } = await supabase.auth.getUser()

  const isLoginPage = request.nextUrl.pathname === '/admin/login'
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')

  // Sem sessão tentando acessar área protegida → login
  if (!user && isAdminRoute && !isLoginPage) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  // Com sessão tentando acessar login → pedidos
  if (user && isLoginPage) {
    return NextResponse.redirect(new URL('/admin/orders', request.url))
  }

  return supabaseResponse
}

export const config = {
  // Roda em todas as rotas exceto arquivos estáticos e APIs internas
  matcher: ['/admin/:path*'],
}