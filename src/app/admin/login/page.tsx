'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Flame, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Input }  from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label }  from '@/components/ui/label'

export default function LoginPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

async function handleLogin(e: React.FormEvent) {
  e.preventDefault()
  setLoading(true)
  setError('')

  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 20))

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  console.log('data:', data)
  console.log('error:', error)

  if (error) {
    setError('Email ou senha inválidos')
    setLoading(false)
    return
  }

  router.push('/admin/orders')
  router.refresh()
}

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-8 border"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor:     'var(--border)',
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'var(--brand)' }}
          >
            <Flame size={24} color="white" />
          </div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            Burgueria Ferreira
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Acesso administrativo
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email" style={{ color: 'var(--text-muted)' }}>
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@burgueria.com"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password" style={{ color: 'var(--text-muted)' }}>
              Senha
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-center" style={{ color: 'var(--error)' }}>
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full mt-2 font-semibold"
            style={{ backgroundColor: 'var(--brand)' }}
          >
            {loading
              ? <><Loader2 size={16} className="animate-spin mr-2" /> Entrando...</>
              : 'Entrar'
            }
          </Button>
        </form>
      </div>
    </div>
  )
}