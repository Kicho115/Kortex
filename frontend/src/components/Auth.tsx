import { useState } from 'react'
import type { FormEvent } from 'react'
import { loginUser, registerUser } from '../api/auth'
import type { UserRead } from '../types/user'
import './Auth.css'

type AuthMode = 'login' | 'register'

interface AuthProps {
  initialMode: AuthMode
  onBack: () => void
  onSuccess: (user: UserRead) => void
}

export default function Auth({ initialMode, onBack, onSuccess }: AuthProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const user =
        mode === 'login'
          ? await loginUser({ email, password })
          : await registerUser({ email, name, password })
      onSuccess(user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="auth" aria-label="Inicio de sesión">
      <div className="auth__glow" aria-hidden="true" />

      <header className="auth__header">
        <button type="button" className="auth__back" onClick={onBack}>
          ← Volver
        </button>
      </header>

      <main className="auth__main">
        <h1 className="auth__title">Inicio de sesión</h1>
        <p className="auth__subtitle">
          {mode === 'login'
            ? 'Accede a tu cuenta de Kortex'
            : 'Crea tu cuenta y prueba Kortex gratis'}
        </p>

        <div className="auth__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={mode === 'login' ? 'auth__tab auth__tab--active' : 'auth__tab'}
            onClick={() => {
              setMode('login')
              setError(null)
            }}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            className={
              mode === 'register' ? 'auth__tab auth__tab--active' : 'auth__tab'
            }
            onClick={() => {
              setMode('register')
              setError(null)
            }}
          >
            Registrarse
          </button>
        </div>

        <form className="auth__form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <label className="auth__field">
              <span>Nombre</span>
              <input
                type="text"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                required
                autoComplete="name"
              />
            </label>
          )}

          <label className="auth__field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@empresa.com"
              required
              autoComplete="email"
            />
          </label>

          <label className="auth__field">
            <span>Contraseña</span>
            <input
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete={
                mode === 'login' ? 'current-password' : 'new-password'
              }
            />
          </label>

          {error && (
            <p className="auth__error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="auth__submit" disabled={loading}>
            {loading
              ? 'Cargando…'
              : mode === 'login'
                ? 'Entrar'
                : 'Crear cuenta'}
          </button>
        </form>
      </main>
    </section>
  )
}
